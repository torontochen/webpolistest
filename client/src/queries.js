import { gql } from "apollo-boost";

/* Posts Queries */
export const GET_POSTS = gql`
  query {
    getPosts {
      _id
      title
      imageBase64
    }
  }
`;

export const GET_POST = gql`
  query($postId: ID!) {
    getPost(postId: $postId) {
      _id
      title
      imageName
      categories
      description
      likes
      createdDate
      imageBase64
      messages {
        _id
        messageBody
        messageDate
        messageUser {
          _id
          username
          avatar
        }
      }
    }
  }
`;

export const SEARCH_POSTS = gql`
  query($searchTerm: String) {
    searchPosts(searchTerm: $searchTerm) {
      _id
      title
      description
      imageName
      likes
    }
  }
`;

/* User Queries */
export const GET_CURRENT_USER = gql`
  query {
    getCurrentUser {
      _id
      username
      email
      password
      avatar
      joinDate
      confirmed
      favorites {
        _id
        title
        imageBase64
      }
    }
  }
`;

export const GET_USER_POSTS = gql`
  query($userId: ID!) {
    getUserPosts(userId: $userId) {
      _id
      title
      imageName
      description
      categories
      createdDate
      likes
      imageBase64
    }
  }
`;

export const INFINITE_SCROLL_POSTS = gql`
  query($pageNum: Int!, $pageSize: Int!) {
    infiniteScrollPosts(pageNum: $pageNum, pageSize: $pageSize) {
      hasMore
      posts {
        _id
        title
        imageName
        categories
        description
        likes
        createdDate
        imageBase64
        messages {
          _id
        }
        createdBy {
          _id
          username
          avatar
        }
      }
    }
  }
`;

/* Posts Mutations */
export const ADD_POST = gql`
  mutation(
    $title: String!
    $imageName: String
    $categories: [String]!
    $description: String!
    $creatorId: ID!
    $imageBase64: String!
  ) {
    addPost(
      title: $title
      imageName: $imageName
      categories: $categories
      description: $description
      creatorId: $creatorId
      imageBase64: $imageBase64
    ) {
      _id
      title
      imageName
      categories
      description
      imageBase64
    }
  }
`;

export const UPDATE_USER_POST = gql`
  mutation(
    $postId: ID!
    $userId: ID!
    $title: String!
    $imageName: String
    $categories: [String]!
    $description: String!
  ) {
    updateUserPost(
      postId: $postId
      userId: $userId
      title: $title
      imageName: $imageName
      categories: $categories
      description: $description
    ) {
      _id
      title
      imageName
      description
      categories
      createdDate
      likes
      createdBy {
        _id
        avatar
      }
    }
  }
`;

export const DELETE_USER_POST = gql`
  mutation($postId: ID!) {
    deleteUserPost(postId: $postId) {
      _id
    }
  }
`;

export const ADD_POST_MESSAGE = gql`
  mutation($messageBody: String!, $userId: ID!, $postId: ID!) {
    addPostMessage(
      messageBody: $messageBody
      userId: $userId
      postId: $postId
    ) {
      _id
      messageBody
      messageDate
      messageUser {
        _id
        username
        avatar
      }
    }
  }
`;

export const LIKE_POST = gql`
  mutation($postId: ID!, $username: String!) {
    likePost(postId: $postId, username: $username) {
      likes
      favorites {
        _id
        title
        imageBase64
      }
    }
  }
`;

export const UNLIKE_POST = gql`
  mutation($postId: ID!, $username: String!) {
    unlikePost(postId: $postId, username: $username) {
      likes
      favorites {
        _id
        title
        imageBase64
      }
    }
  }
`;

/* User Mutations */
export const SIGNIN_USER = gql`
  mutation($username: String!, $password: String!) {
    signinUser(username: $username, password: $password) {
      token
      confirmed
    }
  }
`;

export const SIGNUP_USER = gql`
  mutation($username: String!, $email: String!, $password: String!) {
    signupUser(username: $username, email: $email, password: $password) {
      token
      emailSent
    }
  }
`;

export const UPLOAD_IMAGE = gql`
  mutation($file: Upload!, $username: String!) {
    uploadImage(file: $file, username: $username) {
      id
      filename
      mimetype
      imageBase64
    }
  }
`;

export const DOWNLOAD_IMAGE = gql`
  mutation($filename: String!, $username: String!) {
    downloadImage(filename: $filename, username: $username) {
      fileDir
    }
  }
`;

export const POST_ADDED = gql`
  subscription {
    postAdded {
      _id
      title
      imageBase64
    }
  }
`;
