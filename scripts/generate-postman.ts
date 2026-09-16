import * as fs from 'fs';
import * as path from 'path';

// Helper to construct Postman Request Item
function createRequest({
  name,
  method,
  urlPath,
  queryParams = [],
  pathVariables = [],
  body = null,
  formdata = null,
  auth = null,
  description = '',
  testScript = null,
}) {
  const pathSegments = urlPath.replace(/^\//, '').split('/');
  const query = queryParams.map(q => ({
    key: q.key,
    value: q.value,
    description: q.description || '',
    disabled: q.disabled || false,
  }));

  const variable = pathVariables.map(v => ({
    key: v.key,
    value: v.value,
    description: v.description || '',
  }));

  const request: any = {
    method,
    header: [
      {
        key: 'Accept',
        value: 'application/json',
        type: 'text',
      },
    ],
    url: {
      raw: `{{baseUrl}}/${pathSegments.join('/')}${
        query.length ? '?' + query.map(q => `${q.key}=${encodeURIComponent(q.value)}`).join('&') : ''
      }`,
      host: ['{{baseUrl}}'],
      path: pathSegments,
      query: query.length ? query : undefined,
      variable: variable.length ? variable : undefined,
    },
    description,
  };

  if (auth === 'bearer') {
    request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{accessToken}}',
          type: 'string',
        },
      ],
    };
  } else if (auth === 'admin_bearer') {
    request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{adminAccessToken}}',
          type: 'string',
        },
      ],
    };
  }

  if (body) {
    request.header.push({
      key: 'Content-Type',
      value: 'application/json',
      type: 'text',
    });
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  } else if (formdata) {
    request.body = {
      mode: 'formdata',
      formdata: formdata.map(f => ({
        key: f.key,
        value: f.value || '',
        type: f.type || 'text',
        description: f.description || '',
        src: f.src || undefined,
      })),
    };
  }

  const item: any = {
    name,
    request,
    response: [],
  };

  if (testScript) {
    item.event = [
      {
        listen: 'test',
        script: {
          exec: testScript.split('\n'),
          type: 'text/javascript',
        },
      },
    ];
  }

  return item;
}

// ─── AUTH TEST SCRIPTS ───
const loginTestScript = `
if (pm.response.code === 200) {
    var res = pm.response.json();
    if (res.data && res.data.accessToken) {
        pm.collectionVariables.set("accessToken", res.data.accessToken);
        console.log("accessToken saved to collection variables");
    }
    if (res.data && res.data.user && res.data.user.refreshToken) {
        pm.collectionVariables.set("refreshToken", res.data.user.refreshToken);
        console.log("refreshToken saved to collection variables");
    }
    if (res.data && res.data.user && res.data.user._id) {
        pm.collectionVariables.set("userId", res.data.user._id);
        console.log("userId saved to collection variables");
    }
}
`;

const adminLoginTestScript = `
if (pm.response.code === 200) {
    var res = pm.response.json();
    if (res.data && res.data.accessToken) {
        pm.collectionVariables.set("adminAccessToken", res.data.accessToken);
        console.log("adminAccessToken saved to collection variables");
    }
    if (res.data && res.data.user && res.data.user._id) {
        pm.collectionVariables.set("adminUserId", res.data.user._id);
    }
}
`;

const registerTestScript = `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("userId", res.data._id);
        console.log("Registered userId saved to collection variables");
    }
}
`;

const collection = {
  info: {
    _postman_id: "were5001-backend-collection-v1",
    name: "WERE5001 Backend API",
    description: "Comprehensive Postman collection for all WERE5001 Backend endpoints including Auth, User Management, Catalog (OSRS, RS3, Skilling), Accounts, Pricing (Valutes, Base Price, Gateways), Sessions, and System Health.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000/api/v1", type: "string" },
    { key: "accessToken", value: "", type: "string" },
    { key: "adminAccessToken", value: "", type: "string" },
    { key: "refreshToken", value: "", type: "string" },
    { key: "userId", value: "65cb75f68fb978d2bcfb1234", type: "string" },
    { key: "adminUserId", value: "65cb75f68fb978d2bcfb5678", type: "string" },
    { key: "osrsItemId", value: "65cb75f68fb978d2bcfb2001", type: "string" },
    { key: "rs3ItemId", value: "65cb75f68fb978d2bcfb2002", type: "string" },
    { key: "skillingId", value: "65cb75f68fb978d2bcfb2003", type: "string" },
    { key: "osrsAccountId", value: "65cb75f68fb978d2bcfb3001", type: "string" },
    { key: "rs3AccountId", value: "65cb75f68fb978d2bcfb3002", type: "string" },
    { key: "valuteId", value: "65cb75f68fb978d2bcfb4001", type: "string" },
    { key: "paymentGatewayId", value: "65cb75f68fb978d2bcfb5001", type: "string" },
    { key: "sessionId", value: "session_demo_987654321", type: "string" },
  ],
  item: [
    // ─── 1. Health & Welcome ───
    {
      name: "01. Health & Welcome",
      item: [
        createRequest({
          name: "Get Welcome Message",
          method: "GET",
          urlPath: "",
          description: "Get root API hello message from AppController",
        }),
        createRequest({
          name: "Health Check",
          method: "GET",
          urlPath: "health",
          description: "Check server status and current timestamp",
        }),
      ],
    },

    // ─── 2. Authentication ───
    {
      name: "02. Authentication",
      item: [
        createRequest({
          name: "Register User",
          method: "POST",
          urlPath: "auth/register",
          body: {
            name: "John Doe",
            email: "john.doe@example.com",
            password: "password123",
          },
          description: "Create a new user account with default role USER",
          testScript: registerTestScript,
        }),
        createRequest({
          name: "Login User",
          method: "POST",
          urlPath: "auth/login",
          body: {
            email: "john.doe@example.com",
            password: "password123",
          },
          description: "Authenticate user and automatically save accessToken, refreshToken, and userId to collection variables",
          testScript: loginTestScript,
        }),
        createRequest({
          name: "Login Admin",
          method: "POST",
          urlPath: "auth/login",
          body: {
            email: "admin@example.com",
            password: "adminpassword123",
          },
          description: "Authenticate admin user and automatically save adminAccessToken to collection variables",
          testScript: adminLoginTestScript,
        }),
        createRequest({
          name: "Refresh Access Token",
          method: "POST",
          urlPath: "auth/refresh-access-token",
          body: {
            refreshToken: "{{refreshToken}}",
          },
          description: "Obtain a fresh access token using the stored refresh token",
          testScript: `
if (pm.response.code === 200) {
    var res = pm.response.json();
    if (res.data && res.data.accessToken) {
        pm.collectionVariables.set("accessToken", res.data.accessToken);
    }
}
`,
        }),
        createRequest({
          name: "Forgot Password (Request OTP)",
          method: "POST",
          urlPath: "auth/forget-password",
          body: {
            email: "john.doe@example.com",
          },
          description: "Send 6-digit OTP to the registered user email address",
        }),
        createRequest({
          name: "Verify OTP Code",
          method: "POST",
          urlPath: "auth/verify-code",
          body: {
            email: "john.doe@example.com",
            otp: "123456",
          },
          description: "Verify the 6-digit OTP received via email",
        }),
        createRequest({
          name: "Reset Password (with verified OTP)",
          method: "POST",
          urlPath: "auth/reset-password",
          body: {
            email: "john.doe@example.com",
            newPassword: "newsecurepassword123",
          },
          description: "Set a new password after successful OTP verification",
        }),
        createRequest({
          name: "Change Password (Authenticated)",
          method: "POST",
          urlPath: "auth/change-password",
          auth: "bearer",
          body: {
            oldPassword: "password123",
            newPassword: "updatedpassword456",
          },
          description: "Change current user password while logged in",
        }),
        createRequest({
          name: "Logout",
          method: "POST",
          urlPath: "auth/logout",
          auth: "bearer",
          description: "Invalidate refresh token and log out the user",
        }),
      ],
    },

    // ─── 3. User Management ───
    {
      name: "03. User Management",
      item: [
        {
          name: "Profile (Self)",
          item: [
            createRequest({
              name: "Get My Profile",
              method: "GET",
              urlPath: "user/me",
              auth: "bearer",
              description: "Retrieve authenticated user profile",
            }),
            createRequest({
              name: "Update My Profile",
              method: "PUT",
              urlPath: "user/me",
              auth: "bearer",
              body: {
                name: "Johnathan Doe",
                username: "johndoe99",
                dob: "1995-05-15",
                phone: "+12345678901",
                gender: "male",
                bio: "Runescape veteran and gold trader.",
                language: "English",
                country: "United States",
                cityState: "New York, NY",
                roadArea: "5th Avenue",
                postalCode: "10001",
                taxId: "TX-998877",
              },
              description: "Update personal profile information",
            }),
            createRequest({
              name: "Delete My Account",
              method: "DELETE",
              urlPath: "user/me",
              auth: "bearer",
              description: "Permanently delete authenticated user account",
            }),
          ],
        },
        {
          name: "File & Avatar Uploads",
          item: [
            createRequest({
              name: "Upload Single Avatar",
              method: "POST",
              urlPath: "user/upload-avatar",
              auth: "bearer",
              formdata: [
                {
                  key: "profileImage",
                  type: "file",
                  description: "Select an image file (jpg, png, webp)",
                },
              ],
              description: "Upload a single user avatar image",
            }),
            createRequest({
              name: "Update Single Avatar",
              method: "PUT",
              urlPath: "user/upload-avatar",
              auth: "bearer",
              formdata: [
                {
                  key: "profileImage",
                  type: "file",
                  description: "Replace avatar with a new image file",
                },
              ],
              description: "Update current avatar image",
            }),
            createRequest({
              name: "Delete Single Avatar",
              method: "DELETE",
              urlPath: "user/upload-avatar",
              auth: "bearer",
              description: "Remove single avatar image",
            }),
            createRequest({
              name: "Upload Multiple Avatars",
              method: "POST",
              urlPath: "user/upload-multiple-avatar",
              auth: "bearer",
              formdata: [
                {
                  key: "multiProfileImage",
                  type: "file",
                  description: "Select avatar image 1",
                },
                {
                  key: "multiProfileImage",
                  type: "file",
                  description: "Select avatar image 2",
                },
              ],
              description: "Upload up to 5 multi-profile gallery images",
            }),
            createRequest({
              name: "Update Multiple Avatars",
              method: "PUT",
              urlPath: "user/upload-multiple-avatar",
              auth: "bearer",
              formdata: [
                {
                  key: "multiProfileImage",
                  type: "file",
                  description: "Replace multi-profile images",
                },
              ],
              description: "Replace gallery images",
            }),
            createRequest({
              name: "Delete Multiple Avatars",
              method: "DELETE",
              urlPath: "user/upload-multiple-avatar",
              auth: "bearer",
              description: "Delete multi-profile gallery images",
            }),
            createRequest({
              name: "Upload PDF File",
              method: "POST",
              urlPath: "user/upload-file",
              auth: "bearer",
              formdata: [
                {
                  key: "userPDF",
                  type: "file",
                  description: "Select a PDF file",
                },
              ],
              description: "Upload document / PDF file for user",
            }),
            createRequest({
              name: "Update PDF File",
              method: "PUT",
              urlPath: "user/upload-file",
              auth: "bearer",
              formdata: [
                {
                  key: "userPDF",
                  type: "file",
                  description: "Replace existing PDF file",
                },
              ],
              description: "Update user PDF file",
            }),
            createRequest({
              name: "Delete PDF File",
              method: "DELETE",
              urlPath: "user/upload-file",
              auth: "bearer",
              description: "Delete user PDF file",
            }),
          ],
        },
        {
          name: "Admin User Management",
          item: [
            createRequest({
              name: "Get All Users (Admin)",
              method: "GET",
              urlPath: "user/all-users",
              auth: "admin_bearer",
              queryParams: [
                { key: "page", value: "1", description: "Page number" },
                { key: "limit", value: "10", description: "Items per page" },
                { key: "search", value: "", description: "Search keyword" },
                { key: "date", value: "", description: "Filter by date" },
              ],
              description: "Admin endpoint to list all users with pagination and search",
            }),
            createRequest({
              name: "Get All Admins (Admin)",
              method: "GET",
              urlPath: "user/all-admins",
              auth: "admin_bearer",
              queryParams: [
                { key: "page", value: "1", description: "Page number" },
                { key: "limit", value: "10", description: "Items per page" },
                { key: "search", value: "", description: "Search keyword" },
              ],
              description: "Admin endpoint to list all admin users",
            }),
            createRequest({
              name: "Get User By ID (Admin)",
              method: "GET",
              urlPath: "user/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{userId}}", description: "Target User Mongo ID" },
              ],
              description: "Admin view specific user details",
            }),
            createRequest({
              name: "Update User By ID (Admin)",
              method: "PUT",
              urlPath: "user/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{userId}}", description: "Target User Mongo ID" },
              ],
              body: {
                name: "John Doe (Verified)",
                role: "ADMIN",
                isVerified: true,
                hasActiveSubscription: true,
              },
              description: "Admin update user details, change role, or toggle verification",
            }),
            createRequest({
              name: "Delete User By ID (Admin)",
              method: "DELETE",
              urlPath: "user/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{userId}}", description: "Target User Mongo ID" },
              ],
              description: "Admin permanently delete a user by ID",
            }),
          ],
        },
      ],
    },

    // ─── 4. Catalog (Items & Skilling) ───
    {
      name: "04. Catalog",
      item: [
        {
          name: "OSRS Items",
          item: [
            createRequest({
              name: "Get All OSRS Items",
              method: "GET",
              urlPath: "catalog/osrs-items",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "search", value: "", description: "Filter by item name" },
                { key: "inStock", value: "true", description: "Filter in stock" },
                { key: "visible", value: "true", description: "Filter visibility" },
              ],
              description: "List OSRS catalog items with filtering & pagination",
            }),
            createRequest({
              name: "Get OSRS Item By ID",
              method: "GET",
              urlPath: "catalog/osrs-items/:id",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              description: "Get single OSRS catalog item by ID",
            }),
            createRequest({
              name: "Create OSRS Item (Admin - JSON)",
              method: "POST",
              urlPath: "catalog/osrs-items",
              auth: "admin_bearer",
              body: {
                item_id: "osrs_twisted_bow_01",
                name: "Twisted Bow",
                image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300",
                inStock: true,
                visible: true,
              },
              description: "Create a new OSRS item (Supports image URL or multipart file upload)",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("osrsItemId", res.data._id);
        console.log("osrsItemId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Create OSRS Item (Admin - Multipart)",
              method: "POST",
              urlPath: "catalog/osrs-items",
              auth: "admin_bearer",
              formdata: [
                { key: "item_id", value: "osrs_scythe_01", type: "text" },
                { key: "name", value: "Scythe of Vitur", type: "text" },
                { key: "inStock", value: "true", type: "text" },
                { key: "visible", value: "true", type: "text" },
                { key: "image", type: "file", description: "Upload item image" },
              ],
              description: "Create OSRS item with file upload",
            }),
            createRequest({
              name: "Update OSRS Item (Admin)",
              method: "PUT",
              urlPath: "catalog/osrs-items/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              body: {
                name: "Twisted Bow (Upgraded)",
                inStock: true,
                visible: true,
              },
              description: "Update OSRS item details",
            }),
            createRequest({
              name: "Set OSRS Item Stock (Admin)",
              method: "PATCH",
              urlPath: "catalog/osrs-items/:id/stock",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              body: {
                inStock: false,
              },
              description: "Explicitly set inStock boolean",
            }),
            createRequest({
              name: "Toggle OSRS Item Stock (Admin)",
              method: "PATCH",
              urlPath: "catalog/osrs-items/:id/toggle-stock",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              description: "Invert current inStock state",
            }),
            createRequest({
              name: "Set OSRS Item Visibility (Admin)",
              method: "PATCH",
              urlPath: "catalog/osrs-items/:id/visibility",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              body: {
                visible: false,
              },
              description: "Explicitly set visible boolean",
            }),
            createRequest({
              name: "Toggle OSRS Item Visibility (Admin)",
              method: "PATCH",
              urlPath: "catalog/osrs-items/:id/toggle-visibility",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              description: "Invert current visible state",
            }),
            createRequest({
              name: "Delete OSRS Item (Admin)",
              method: "DELETE",
              urlPath: "catalog/osrs-items/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsItemId}}", description: "OSRS Item Mongo ID" },
              ],
              description: "Remove OSRS item from catalog",
            }),
          ],
        },
        {
          name: "RS3 Items",
          item: [
            createRequest({
              name: "Get All RS3 Items",
              method: "GET",
              urlPath: "catalog/rs3-items",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "search", value: "", description: "Filter by item name" },
                { key: "inStock", value: "true", description: "Filter in stock" },
                { key: "visible", value: "true", description: "Filter visibility" },
              ],
              description: "List RS3 catalog items with filtering & pagination",
            }),
            createRequest({
              name: "Get RS3 Item By ID",
              method: "GET",
              urlPath: "catalog/rs3-items/:id",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              description: "Get single RS3 catalog item by ID",
            }),
            createRequest({
              name: "Create RS3 Item (Admin - JSON)",
              method: "POST",
              urlPath: "catalog/rs3-items",
              auth: "admin_bearer",
              body: {
                item_id: "rs3_blue_partyhat_01",
                name: "Blue Partyhat",
                image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300",
                inStock: true,
                visible: true,
              },
              description: "Create a new RS3 item",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("rs3ItemId", res.data._id);
        console.log("rs3ItemId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Update RS3 Item (Admin)",
              method: "PUT",
              urlPath: "catalog/rs3-items/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              body: {
                name: "Blue Partyhat (Mint)",
                inStock: true,
                visible: true,
              },
              description: "Update RS3 item details",
            }),
            createRequest({
              name: "Set RS3 Item Stock (Admin)",
              method: "PATCH",
              urlPath: "catalog/rs3-items/:id/stock",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              body: {
                inStock: false,
              },
              description: "Set RS3 stock state",
            }),
            createRequest({
              name: "Toggle RS3 Item Stock (Admin)",
              method: "PATCH",
              urlPath: "catalog/rs3-items/:id/toggle-stock",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              description: "Toggle RS3 stock boolean",
            }),
            createRequest({
              name: "Set RS3 Item Visibility (Admin)",
              method: "PATCH",
              urlPath: "catalog/rs3-items/:id/visibility",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              body: {
                visible: false,
              },
              description: "Set RS3 visibility state",
            }),
            createRequest({
              name: "Toggle RS3 Item Visibility (Admin)",
              method: "PATCH",
              urlPath: "catalog/rs3-items/:id/toggle-visibility",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              description: "Toggle RS3 visibility boolean",
            }),
            createRequest({
              name: "Delete RS3 Item (Admin)",
              method: "DELETE",
              urlPath: "catalog/rs3-items/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3ItemId}}", description: "RS3 Item Mongo ID" },
              ],
              description: "Remove RS3 item from catalog",
            }),
          ],
        },
        {
          name: "Skilling Services",
          item: [
            createRequest({
              name: "Get All Skilling Services",
              method: "GET",
              urlPath: "catalog/skilling",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "search", value: "", description: "Filter by skill service name" },
                { key: "visible", value: "true", description: "Filter visibility" },
              ],
              description: "List all skilling services",
            }),
            createRequest({
              name: "Get Skilling Service By ID",
              method: "GET",
              urlPath: "catalog/skilling/:id",
              pathVariables: [
                { key: "id", value: "{{skillingId}}", description: "Skilling Mongo ID" },
              ],
              description: "Get skilling service by ID",
            }),
            createRequest({
              name: "Create Skilling Service (Admin)",
              method: "POST",
              urlPath: "catalog/skilling",
              auth: "admin_bearer",
              body: {
                item_id: "osrs_agility_boost_01",
                name: "1-99 Agility Powerleveling",
                image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300",
                methods: {
                  rooftop: {
                    title: "Rooftop Courses",
                    levels: "1-99",
                    pricePerLevel: 2.5,
                    estimatedDays: 7,
                  },
                  prifddinas: {
                    title: "Prifddinas Course",
                    levels: "75-99",
                    pricePerLevel: 3.0,
                    estimatedDays: 5,
                  },
                },
                visible: true,
              },
              description: "Create skilling service package with methods map",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("skillingId", res.data._id);
        console.log("skillingId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Update Skilling Service (Admin)",
              method: "PUT",
              urlPath: "catalog/skilling/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{skillingId}}", description: "Skilling Mongo ID" },
              ],
              body: {
                name: "1-99 Agility Powerleveling (Express)",
                visible: true,
              },
              description: "Update skilling service properties",
            }),
            createRequest({
              name: "Update Skilling Methods (Admin)",
              method: "PATCH",
              urlPath: "catalog/skilling/:id/methods",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{skillingId}}", description: "Skilling Mongo ID" },
              ],
              body: {
                methods: {
                  rooftop_express: {
                    title: "Rooftop Express 24/7",
                    levels: "1-99",
                    pricePerLevel: 3.5,
                  },
                },
              },
              description: "Patch the methods object of a skilling service",
            }),
            createRequest({
              name: "Set Skilling Visibility (Admin)",
              method: "PATCH",
              urlPath: "catalog/skilling/:id/visibility",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{skillingId}}", description: "Skilling Mongo ID" },
              ],
              body: {
                visible: false,
              },
              description: "Set skilling visibility state",
            }),
            createRequest({
              name: "Toggle Skilling Visibility (Admin)",
              method: "PATCH",
              urlPath: "catalog/skilling/:id/toggle-visibility",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{skillingId}}", description: "Skilling Mongo ID" },
              ],
              description: "Toggle skilling visibility state",
            }),
            createRequest({
              name: "Delete Skilling Service (Admin)",
              method: "DELETE",
              urlPath: "catalog/skilling/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{skillingId}}", description: "Skilling Mongo ID" },
              ],
              description: "Delete skilling service",
            }),
          ],
        },
      ],
    },

    // ─── 5. Accounts ───
    {
      name: "05. Accounts",
      item: [
        {
          name: "OSRS Accounts",
          item: [
            createRequest({
              name: "Get All OSRS Accounts",
              method: "GET",
              urlPath: "accounts/osrs",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "search", value: "", description: "Search by account title" },
                { key: "minPrice", value: "0", description: "Min price filter" },
                { key: "maxPrice", value: "1000", description: "Max price filter" },
              ],
              description: "List OSRS accounts for sale with filters",
            }),
            createRequest({
              name: "Get OSRS Account By ID",
              method: "GET",
              urlPath: "accounts/osrs/:id",
              pathVariables: [
                { key: "id", value: "{{osrsAccountId}}", description: "OSRS Account Mongo ID" },
              ],
              description: "Get single OSRS account details",
            }),
            createRequest({
              name: "Create OSRS Account (Admin)",
              method: "POST",
              urlPath: "accounts/osrs",
              auth: "admin_bearer",
              body: {
                acc_id: "osrs_pure_60atk",
                name: "60 Attack 1 Def Pure (Infernal Cape)",
                description: "99 Str, 99 Range, 99 Mage, Mithril Gloves, Fire/Infernal Cape, fully quested.",
                image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400",
                price: 249.99,
                stock: 2,
              },
              description: "Create new OSRS account listing",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("osrsAccountId", res.data._id);
        console.log("osrsAccountId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Update OSRS Account (Admin)",
              method: "PUT",
              urlPath: "accounts/osrs/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsAccountId}}", description: "OSRS Account Mongo ID" },
              ],
              body: {
                name: "60 Attack 1 Def Pure (Infernal Cape) - Promo",
                price: 229.99,
                stock: 3,
              },
              description: "Update OSRS account listing",
            }),
            createRequest({
              name: "Adjust OSRS Account Stock (Admin)",
              method: "PATCH",
              urlPath: "accounts/osrs/:id/stock",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsAccountId}}", description: "OSRS Account Mongo ID" },
              ],
              body: {
                amount: 1,
              },
              description: "Adjust account stock count by delta (+1 to increment, -1 to decrement)",
            }),
            createRequest({
              name: "Delete OSRS Account (Admin)",
              method: "DELETE",
              urlPath: "accounts/osrs/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{osrsAccountId}}", description: "OSRS Account Mongo ID" },
              ],
              description: "Delete OSRS account listing",
            }),
          ],
        },
        {
          name: "RS3 Accounts",
          item: [
            createRequest({
              name: "Get All RS3 Accounts",
              method: "GET",
              urlPath: "accounts/rs3",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "search", value: "", description: "Search by account title" },
                { key: "minPrice", value: "0", description: "Min price filter" },
                { key: "maxPrice", value: "1000", description: "Max price filter" },
              ],
              description: "List RS3 accounts for sale",
            }),
            createRequest({
              name: "Get RS3 Account By ID",
              method: "GET",
              urlPath: "accounts/rs3/:id",
              pathVariables: [
                { key: "id", value: "{{rs3AccountId}}", description: "RS3 Account Mongo ID" },
              ],
              description: "Get single RS3 account details",
            }),
            createRequest({
              name: "Create RS3 Account (Admin)",
              method: "POST",
              urlPath: "accounts/rs3",
              auth: "admin_bearer",
              body: {
                acc_id: "rs3_maxed_main_2898",
                name: "2898 Total Level RS3 Maxed Main",
                description: "Overloads unlocked, Ancient Curses, all combat styles T92 weapons, 15-year veteran cape.",
                image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400",
                price: 349.00,
                stock: 1,
              },
              description: "Create new RS3 account listing",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("rs3AccountId", res.data._id);
        console.log("rs3AccountId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Update RS3 Account (Admin)",
              method: "PUT",
              urlPath: "accounts/rs3/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3AccountId}}", description: "RS3 Account Mongo ID" },
              ],
              body: {
                name: "2898 Total Level RS3 Maxed Main (Discounted)",
                price: 319.00,
              },
              description: "Update RS3 account listing",
            }),
            createRequest({
              name: "Adjust RS3 Account Stock (Admin)",
              method: "PATCH",
              urlPath: "accounts/rs3/:id/stock",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3AccountId}}", description: "RS3 Account Mongo ID" },
              ],
              body: {
                amount: -1,
              },
              description: "Adjust RS3 account stock count",
            }),
            createRequest({
              name: "Delete RS3 Account (Admin)",
              method: "DELETE",
              urlPath: "accounts/rs3/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{rs3AccountId}}", description: "RS3 Account Mongo ID" },
              ],
              description: "Delete RS3 account listing",
            }),
          ],
        },
      ],
    },

    // ─── 6. Pricing, Valutes & Gateways ───
    {
      name: "06. Pricing, Valutes & Gateways",
      item: [
        {
          name: "Valutes (Currencies)",
          item: [
            createRequest({
              name: "Get All Valutes",
              method: "GET",
              urlPath: "pricing/valutes",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "search", value: "", description: "Search currency name" },
              ],
              description: "List all supported payment currencies/valutes",
            }),
            createRequest({
              name: "Get Valute By ID",
              method: "GET",
              urlPath: "pricing/valutes/:id",
              pathVariables: [
                { key: "id", value: "{{valuteId}}", description: "Valute Mongo ID" },
              ],
              description: "Get specific currency rate details",
            }),
            createRequest({
              name: "Create Valute (Admin)",
              method: "POST",
              urlPath: "pricing/valutes",
              auth: "admin_bearer",
              body: {
                real_id: "USD",
                name: "US Dollar",
                image: "https://flagcdn.com/w40/us.png",
                osrs_buy: 0.22,
                osrs_sell: 0.28,
                rs3_buy: 0.031,
                rs3_sell: 0.042,
                paytriot: false,
                login_required: false,
                buy_limit_min: 5.0,
                buy_limit_max: 5000.0,
                sell_limit_min: 5.0,
                sell_limit_max: 5000.0,
              },
              description: "Create currency config with game buy/sell exchange multipliers",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("valuteId", res.data._id);
        console.log("valuteId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Update Valute (Admin)",
              method: "PUT",
              urlPath: "pricing/valutes/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{valuteId}}", description: "Valute Mongo ID" },
              ],
              body: {
                name: "US Dollar (Updated)",
                osrs_buy: 0.23,
                osrs_sell: 0.29,
                buy_limit_max: 10000.0,
              },
              description: "Update currency rates and limits",
            }),
            createRequest({
              name: "Delete Valute (Admin)",
              method: "DELETE",
              urlPath: "pricing/valutes/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{valuteId}}", description: "Valute Mongo ID" },
              ],
              description: "Delete valute configuration",
            }),
          ],
        },
        {
          name: "Base Price & Gold Rate",
          item: [
            createRequest({
              name: "Get Base Gold Price",
              method: "GET",
              urlPath: "pricing/base-price",
              description: "Fetch singleton base price rates for OSRS and RS3 gold per million",
            }),
            createRequest({
              name: "Update Base Gold Price (Admin)",
              method: "PUT",
              urlPath: "pricing/base-price",
              auth: "admin_bearer",
              body: {
                osrs: 0.24,
                rs3: 0.034,
              },
              description: "Admin update base price per M for OSRS and RS3",
            }),
            createRequest({
              name: "Calculate Gold Rate (OSRS)",
              method: "GET",
              urlPath: "pricing/gold-rate",
              queryParams: [
                { key: "game", value: "osrs", description: "Game mode ('osrs' or 'rs3')" },
                { key: "valuteId", value: "{{valuteId}}", description: "Optional Valute Mongo ID to calculate in local currency", disabled: true },
              ],
              description: "Calculate effective gold rate considering base price and currency multipliers",
            }),
            createRequest({
              name: "Calculate Gold Rate (RS3)",
              method: "GET",
              urlPath: "pricing/gold-rate",
              queryParams: [
                { key: "game", value: "rs3", description: "Game mode" },
              ],
              description: "Calculate RS3 gold rate",
            }),
          ],
        },
        {
          name: "Payment Gateway Settings",
          item: [
            createRequest({
              name: "Get All Payment Gateways",
              method: "GET",
              urlPath: "pricing/payments",
              description: "Fetch all configured payment gateway records",
            }),
            createRequest({
              name: "Get Payment Gateway By ID",
              method: "GET",
              urlPath: "pricing/payments/:id",
              pathVariables: [
                { key: "id", value: "{{paymentGatewayId}}", description: "Payment Gateway Mongo ID" },
              ],
              description: "Get specific payment gateway configuration",
            }),
            createRequest({
              name: "Create Payment Gateway (Admin)",
              method: "POST",
              urlPath: "pricing/payments",
              auth: "admin_bearer",
              body: {
                valuteId: "{{valuteId}}",
                osrs_buy: {
                  gateway: "stripe",
                  feePercentage: 2.9,
                  fixedFee: 0.30,
                  enabled: true,
                },
                osrs_sell: {
                  gateway: "paypal",
                  feePercentage: 2.0,
                  fixedFee: 0.25,
                  enabled: true,
                },
                rs3_buy: {
                  gateway: "crypto",
                  feePercentage: 1.0,
                  fixedFee: 0.0,
                  enabled: true,
                },
                rs3_sell: {
                  gateway: "bank_transfer",
                  feePercentage: 0.5,
                  fixedFee: 1.00,
                  enabled: true,
                },
              },
              description: "Create payment gateway rules and fees per game and action",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data._id) {
        pm.collectionVariables.set("paymentGatewayId", res.data._id);
        console.log("paymentGatewayId saved:", res.data._id);
    }
}
`,
            }),
            createRequest({
              name: "Update Payment Gateway (Admin)",
              method: "PUT",
              urlPath: "pricing/payments/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{paymentGatewayId}}", description: "Payment Gateway Mongo ID" },
              ],
              body: {
                osrs_buy: {
                  gateway: "stripe",
                  feePercentage: 2.5,
                  fixedFee: 0.25,
                  enabled: true,
                },
              },
              description: "Update payment gateway config",
            }),
            createRequest({
              name: "Delete Payment Gateway (Admin)",
              method: "DELETE",
              urlPath: "pricing/payments/:id",
              auth: "admin_bearer",
              pathVariables: [
                { key: "id", value: "{{paymentGatewayId}}", description: "Payment Gateway Mongo ID" },
              ],
              description: "Delete payment gateway config record",
            }),
          ],
        },
      ],
    },

    // ─── 7. Sessions ───
    {
      name: "07. Sessions",
      item: [
        createRequest({
          name: "Create / Init Session",
          method: "POST",
          urlPath: "sessions",
          body: {
            session_id: "sess_cart_demo_001",
            userId: "{{userId}}",
            data: {
              cart: [
                { itemType: "osrs_item", itemId: "{{osrsItemId}}", quantity: 5, priceEach: 0.24 },
                { itemType: "osrs_account", accountId: "{{osrsAccountId}}", quantity: 1, priceEach: 249.99 },
              ],
              selectedCurrency: "USD",
            },
            expiry: "2026-12-31T23:59:59.000Z",
          },
          description: "Initialize or store user cart / checkout session",
          testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data.session_id) {
        pm.collectionVariables.set("sessionId", res.data.session_id);
        console.log("sessionId saved:", res.data.session_id);
    }
}
`,
        }),
        createRequest({
          name: "Get Session By SessionId",
          method: "GET",
          urlPath: "sessions/:sessionId",
          pathVariables: [
            { key: "sessionId", value: "{{sessionId}}", description: "Unique session identifier" },
          ],
          description: "Retrieve session state by string sessionId",
        }),
        createRequest({
          name: "Get User Sessions (Authenticated)",
          method: "GET",
          urlPath: "sessions/user/:userId",
          auth: "bearer",
          pathVariables: [
            { key: "userId", value: "{{userId}}", description: "Target User Mongo ID" },
          ],
          description: "List all active sessions belonging to a specific user",
        }),
        createRequest({
          name: "Update Session State",
          method: "PUT",
          urlPath: "sessions/:sessionId",
          pathVariables: [
            { key: "sessionId", value: "{{sessionId}}", description: "Unique session identifier" },
          ],
          body: {
            data: {
              cart: [
                { itemType: "osrs_item", itemId: "{{osrsItemId}}", quantity: 10, priceEach: 0.24 },
              ],
              step: "checkout_payment_selection",
            },
            expiry: "2027-01-01T00:00:00.000Z",
          },
          description: "Update arbitrary session data payload or renew expiry",
        }),
        createRequest({
          name: "Delete Session",
          method: "DELETE",
          urlPath: "sessions/:sessionId",
          pathVariables: [
            { key: "sessionId", value: "{{sessionId}}", description: "Unique session identifier" },
          ],
          description: "Delete session and clear associated cached state",
        }),
      ],
    },

    // ─── 8. Payments (PayPal, Skrill & Transactions) ───
    {
      name: "08. Payments",
      item: [
        {
          name: "PayPal Gateway",
          item: [
            createRequest({
              name: "Create PayPal Order",
              method: "POST",
              urlPath: "payments/paypal/create-order",
              body: {
                amount: 22.5,
                currency: "USD",
                customerEmail: "customer@example.com",
                productType: "gold_osrs",
                productDetails: {
                  gameCharacterName: "ZihadRS",
                  quantityM: 100,
                  description: "100M OSRS Gold",
                },
                returnUrl: "http://localhost:3000/payment/success",
                cancelUrl: "http://localhost:3000/payment/cancel",
              },
              description: "Initiate PayPal order and get approve URL",
            }),
            createRequest({
              name: "Capture PayPal Order",
              method: "POST",
              urlPath: "payments/paypal/capture-order/:orderId",
              pathVariables: [
                { key: "orderId", value: "8XX12345YY67890", description: "PayPal Order ID" },
              ],
              description: "Capture authorized PayPal payment",
            }),
            createRequest({
              name: "PayPal Webhook Listener",
              method: "POST",
              urlPath: "payments/paypal/webhook",
              body: {
                event_type: "PAYMENT.CAPTURE.COMPLETED",
                resource: {
                  id: "CAPTURE-12345",
                  custom_id: "65cb75f68fb978d2bcfb1234",
                },
              },
              description: "PayPal Webhook endpoint for async event verification",
            }),
          ],
        },
        {
          name: "Skrill Gateway",
          item: [
            createRequest({
              name: "Create Skrill Payment Session",
              method: "POST",
              urlPath: "payments/skrill/create-session",
              body: {
                amount: 25.0,
                currency: "USD",
                customerEmail: "customer@example.com",
                productType: "gold_osrs",
                productDetails: {
                  gameCharacterName: "ZihadRS",
                  quantityM: 100,
                },
                returnUrl: "http://localhost:3000/payment/success",
                cancelUrl: "http://localhost:3000/payment/cancel",
              },
              description: "Generate Skrill Quick Checkout parameters and form fields",
            }),
            createRequest({
              name: "Skrill IPN / Status Callback",
              method: "POST",
              urlPath: "payments/skrill/ipn",
              body: {
                merchant_id: "123456",
                transaction_id: "65cb75f68fb978d2bcfb1234",
                mb_transaction_id: "SKRILL-998877",
                mb_amount: "25.00",
                mb_currency: "USD",
                status: "2",
                md5sig: "A1B2C3D4E5F6",
              },
              description: "Skrill Status Callback / IPN webhook with MD5 signature validation",
            }),
          ],
        },
        {
          name: "Transaction Queries",
          item: [
            createRequest({
              name: "Get All Transactions (Admin)",
              method: "GET",
              urlPath: "payments/transactions",
              auth: "admin_bearer",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
                { key: "gateway", value: "paypal", description: "Filter by gateway (paypal/skrill)" },
                { key: "status", value: "completed", description: "Filter by status" },
                { key: "search", value: "", description: "Search by email or transaction id" },
              ],
              description: "List all payment transactions with filters and pagination (Admin)",
            }),
            createRequest({
              name: "Get My Transactions (Authenticated User)",
              method: "GET",
              urlPath: "payments/transactions/my",
              auth: "bearer",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "10", description: "Limit" },
              ],
              description: "List current user's transaction history",
            }),
            createRequest({
              name: "Get Transaction By ID",
              method: "GET",
              urlPath: "payments/transactions/:id",
              auth: "bearer",
              pathVariables: [
                { key: "id", value: "65cb75f68fb978d2bcfb1234", description: "Transaction Mongo ID or Gateway ID" },
              ],
              description: "Retrieve details of a single transaction",
            }),
          ],
        },
      ],
    },

    // ─── 9. Live Chat & Order Pre-Fills ───
    {
      name: "09. Live Chat & Order Pre-Fills",
      item: [
        {
          name: "Automated Order Pre-Fills",
          item: [
            createRequest({
              name: "Pre-fill Buy Gold Order",
              method: "POST",
              urlPath: "chat/prefill-order",
              body: {
                guestId: "guest_browser_token_123",
                customerName: "Zihad Customer",
                customerEmail: "zihad@example.com",
                actionType: "buy_gold",
                game: "osrs",
                quantityM: 200,
                totalPrice: 45.0,
                currency: "USD",
                gameCharacterName: "IronZihad",
                paymentMethod: "PayPal",
                notes: "Please deliver at Lumbridge World 301",
              },
              description: "Triggered on clicking 'Buy Gold' across site to generate automated formatted message in live chat",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data.conversation && res.data.conversation.roomId) {
        pm.collectionVariables.set("roomId", res.data.conversation.roomId);
        console.log("Chat roomId saved:", res.data.conversation.roomId);
    }
}
`,
            }),
            createRequest({
              name: "Pre-fill Sell Gold Request",
              method: "POST",
              urlPath: "chat/prefill-order",
              body: {
                guestId: "guest_browser_token_123",
                customerName: "Seller Pro",
                customerEmail: "seller@example.com",
                actionType: "sell_gold",
                game: "rs3",
                quantityM: 500,
                totalPrice: 15.5,
                currency: "USD",
                gameCharacterName: "GoldSeller99",
                paymentMethod: "Skrill",
              },
              description: "Triggered on clicking 'Sell Gold' to initiate live trade discussion with Admin",
            }),
            createRequest({
              name: "Pre-fill Buy Item Order",
              method: "POST",
              urlPath: "chat/prefill-order",
              body: {
                guestId: "guest_browser_token_123",
                customerName: "Zihad Customer",
                actionType: "buy_item",
                game: "osrs",
                itemName: "Twisted Bow",
                quantity: 1,
                totalPrice: 240.0,
                currency: "USD",
                gameCharacterName: "Archer99",
                paymentMethod: "PayPal",
              },
              description: "Triggered on clicking 'Buy Item' button on catalog item cards",
            }),
            createRequest({
              name: "Pre-fill Powerleveling / Service Order",
              method: "POST",
              urlPath: "chat/prefill-order",
              body: {
                guestId: "guest_browser_token_123",
                customerName: "Zihad Customer",
                actionType: "powerleveling",
                game: "osrs",
                serviceName: "Agility Powerleveling",
                skillDetails: "Level 1 to 99 with Graceful Outfit",
                totalPrice: 120.0,
                currency: "USD",
                gameCharacterName: "RunnerBoy",
              },
              description: "Triggered on clicking 'Request Service / Powerleveling' on site",
            }),
          ],
        },
        {
          name: "Conversations & Messages",
          item: [
            createRequest({
              name: "Init / Resume Conversation",
              method: "POST",
              urlPath: "chat/conversations/init",
              body: {
                guestId: "guest_browser_token_123",
                customerName: "Zihad Visitor",
                customerEmail: "zihad@example.com",
              },
              description: "Initialize or resume active live chat conversation",
              testScript: `
if (pm.response.code === 201) {
    var res = pm.response.json();
    if (res.data && res.data.roomId) {
        pm.collectionVariables.set("roomId", res.data.roomId);
        console.log("Chat roomId saved:", res.data.roomId);
    }
}
`,
            }),
            createRequest({
              name: "Get All Conversations (Admin)",
              method: "GET",
              urlPath: "chat/conversations",
              auth: "admin_bearer",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "15", description: "Limit" },
                { key: "status", value: "active", description: "Filter active/closed" },
                { key: "search", value: "", description: "Search customer name/email/roomId" },
              ],
              description: "Admin live support queue: list all conversations",
            }),
            createRequest({
              name: "Get My Conversations (User)",
              method: "GET",
              urlPath: "chat/conversations/my",
              auth: "bearer",
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "15", description: "Limit" },
              ],
              description: "Get current user's past support conversations",
            }),
            createRequest({
              name: "Get Conversation Messages By Room ID",
              method: "GET",
              urlPath: "chat/conversations/:roomId",
              pathVariables: [
                { key: "roomId", value: "{{roomId}}", description: "Room ID identifier" },
              ],
              queryParams: [
                { key: "page", value: "1", description: "Page" },
                { key: "limit", value: "50", description: "Limit" },
              ],
              description: "Retrieve full chat conversation message history",
            }),
            createRequest({
              name: "Send Message (HTTP Fallback)",
              method: "POST",
              urlPath: "chat/conversations/:roomId/messages",
              pathVariables: [
                { key: "roomId", value: "{{roomId}}", description: "Room ID identifier" },
              ],
              body: {
                content: "Hello, I placed an order pre-fill. When can we trade in game?",
                senderName: "Zihad Customer",
                senderType: "customer",
              },
              description: "Send message via REST endpoint (or use Socket.IO)",
            }),
            createRequest({
              name: "Mark Messages as Read",
              method: "PATCH",
              urlPath: "chat/conversations/:roomId/read",
              pathVariables: [
                { key: "roomId", value: "{{roomId}}", description: "Room ID identifier" },
              ],
              body: {
                readerType: "admin",
              },
              description: "Clear unread count for admin or customer",
            }),
            createRequest({
              name: "Close Conversation",
              method: "PATCH",
              urlPath: "chat/conversations/:roomId/close",
              pathVariables: [
                { key: "roomId", value: "{{roomId}}", description: "Room ID identifier" },
              ],
              description: "Mark conversation status as closed/resolved",
            }),
          ],
        },
      ],
    },
  ],
};

const environment = {
  id: "were5001-local-environment",
  name: "WERE5001 Backend (Local)",
  values: [
    {
      key: "baseUrl",
      value: "http://localhost:5000/api/v1",
      type: "default",
      enabled: true,
    },
    {
      key: "accessToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "adminAccessToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "refreshToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "userId",
      value: "65cb75f68fb978d2bcfb1234",
      type: "default",
      enabled: true,
    },
    {
      key: "adminUserId",
      value: "65cb75f68fb978d2bcfb5678",
      type: "default",
      enabled: true,
    },
    {
      key: "osrsItemId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "rs3ItemId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "skillingId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "osrsAccountId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "rs3AccountId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "valuteId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "paymentGatewayId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "sessionId",
      value: "sess_cart_demo_001",
      type: "default",
      enabled: true,
    },
    {
      key: "roomId",
      value: "room_demo_12345",
      type: "default",
      enabled: true,
    },
  ],
  _postman_variable_scope: "environment",
};

const rootDir = process.cwd();
const collectionPath = path.join(rootDir, 'were5001-backend.postman_collection.json');
const environmentPath = path.join(rootDir, 'were5001-backend.postman_environment.json');

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf-8');
fs.writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf-8');

console.log(`Generated collection at: ${collectionPath}`);
console.log(`Generated environment at: ${environmentPath}`);
