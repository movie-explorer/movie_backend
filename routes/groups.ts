import { IncomingMessage, ServerResponse } from 'http';
import { auth, db } from '../connectors/shared';

const inviteCodes: Record<string, string> = {}; // In-memory storage for invite codes

// Utility function to send response
const sendResponse = (res: ServerResponse, statusCode: number, data: any) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Utility function to generate a random invite code
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8); // Random alphanumeric string
};

// Function to handle group-related routes
export const groupsRoute = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const { method, url } = req;
  const authHeader = req.headers['authorization'];
  let username = '';

  if (authHeader) {
    try {
      const encodedUsername = authHeader.split('.')[0];
      username = Buffer.from(encodedUsername, 'base64').toString();
    } catch (error) {
      console.warn('Failed to decode username from Authorization header:', error);
    }
  }

  if (!auth.isUserLoggedin(authHeader ?? '')) {
    console.log('not logged in')
    sendResponse(res, 403, { error: 'Not logged in' });
    return;
  }
    
  console.log('logged in')

  username = username || '';
  if (username === '') {
    sendResponse(res, 400, { error: 'Username is required' });
    return;
  }

  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { groupName, groupid, movieName, tmdbID, watchDate, inviteCode } = JSON.parse(body);

        if (url && url.endsWith('/join')) {
          // Join group with invite code
          if (!inviteCode) {
            sendResponse(res, 400, { error: 'Invite code is required' });
            return;
          }

          // Check if invite code is valid
          if (inviteCodes[inviteCode]) {
            const groupid = inviteCodes[inviteCode];
            const success = await db.addUserToGroup(parseInt(groupid, 10), username); // Ensure user is not owner
            if (success) {
              sendResponse(res, 200, { message: 'User added to group successfully' });
            } else {
              sendResponse(res, 500, { error: 'Failed to add user to group' });
            }
          } else {
            sendResponse(res, 400, { error: 'Invalid invite code' });
          }
        } else if (url && url.endsWith('/update')) {
          // Add movie to the group
          if (movieName && tmdbID && watchDate) {
            if (!groupid) {
              sendResponse(res, 400, { error: 'Group ID is required to add a movie' });
              return;
            }

            const success = await db.addMovieAndLinkToGroup(groupid, movieName, tmdbID, watchDate);
            if (success) {
              sendResponse(res, 200, { message: 'Movie added and linked to group successfully' });
            } else {
              sendResponse(res, 500, { error: 'Failed to add movie to group' });
            }
          } else {
            sendResponse(res, 400, { error: 'Movie name, tmdbID, and watchDate are required to update the group with a movie' });
          }
        } else {
          // Create a new group
          if (!groupName) {
            sendResponse(res, 400, { error: 'Group name is required to create a group' });
            return;
          }

          const success = await db.createGroup(groupName, username);
          if (success) {
                sendResponse(res, 200, {
                  message: 'Group created successfully and you are the owner',
                });
              } else {
                sendResponse(res, 500, {
                  message: success,
                });
              }
            }
      } catch (error) {
        sendResponse(res, 500, { error: 'Internal server error' });
      }
    });
  } else if (method === 'DELETE') {
    // Delete a group or remove a user from a group
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { groupid, username2 } = JSON.parse(body);

        // Case 1: If groupid is provided, and we don't have a username, delete the whole group
        if (groupid && !username2) {
          if (!(await db.checkIfUserIsOwner(groupid, username)))
            return sendResponse(res, 403, { error: 'Not allowed' });
          const success = await db.deleteGroup(groupid); // Delete the entire group
          if (success) {
            sendResponse(res, 200, { message: 'Group deleted successfully' });
          } else {
            sendResponse(res, 403, { error: 'You are not authorized to delete this group' });
          }
        } 
        // Case 2: If groupid and username are provided, remove the user from the group
        else if (groupid && username2) {
          if (!(await db.checkIfUserIsOwner(groupid, username)))
            return sendResponse(res, 403, { error: 'Not allowed' });
              
          const success = await db.removeUserFromGroup(groupid, username2); // Remove a user from the group
          if (success) {
            sendResponse(res, 200, { message: 'User removed from group successfully' });
          } else {
            sendResponse(res, 500, { error: 'Failed to remove user from group' });
          }
        } 
        // Case 3: If groupid is missing, return an error
        else {
          sendResponse(res, 400, { error: 'Group ID is required' });
        }
      } catch (error) {
        sendResponse(res, 500, { error: 'Internal server error' });
      }
    });
  } else if (method === 'GET') {
    // Handle GET requests for retrieving group info, members, and movies in group
    const urlParams = new URLSearchParams(url?.split('?')[1] || '');
    const groupid = urlParams.get('groupid');
    const requestInviteCode = urlParams.get('requestInviteCode'); // New query parameter to request an invite code

    if (requestInviteCode) {
      // Request invite code for a specific group
      try {
        const group = await db.getGroupById(parseInt(requestInviteCode, 10)); // Assuming requestInviteCode is a group ID
        if (group) {
          // Generate invite code only for existing group
          const inviteCode = generateInviteCode();
          inviteCodes[inviteCode] = requestInviteCode; // Store the invite code for the group
          sendResponse(res, 200, { inviteCode });
        } else {
          sendResponse(res, 404, { error: 'Group not found' });
        }
      } catch (error) {
        console.log(error);
        sendResponse(res, 500, { error: 'Internal server error' });
      }
      return;
    }

    if (groupid) {
      try {
        // Fetch group members
        const members = await db.getGroupMembers(parseInt(groupid, 10));

        // Fetch movies linked to the group, including the watch date
        const movies = await db.getGroupMoviesWithWatchDate(parseInt(groupid, 10));

        sendResponse(res, 200, {
          members,
          movies: movies || [],  // If no movies, return an empty array
        });
      } catch (error) {
        sendResponse(res, 500, { error: 'Internal server error' });
      }
    } else {
      // Fetch user groups if no groupid is provided
      try {
        const groups = await db.getUserGroups(username);
        sendResponse(res, 200, { groups });
      } catch (error) {
        sendResponse(res, 500, { error: 'Internal server error' });
      }
    }
  } else {
    try {
      const groups = await db.getAllGroups();
      sendResponse(res, 200, { groups });
    } catch (error) {
      sendResponse(res, 500, { error: 'Internal server error' });
    }
  }
};
