import Vue from "vue";
import Vuex from "vuex";
import router from "./router";

import {
  defaultClient as apolloClient
} from "./main";

import {
  GET_CURRENT_USER,
  GET_POSTS,
  INFINITE_SCROLL_POSTS,
  GET_USER_POSTS,
  SEARCH_POSTS,
  ADD_POST,
  UPDATE_USER_POST,
  DELETE_USER_POST,
  SIGNIN_USER,
  SIGNUP_USER,
  UPLOAD_IMAGE,
  DOWNLOAD_IMAGE
} from "./queries";
// import { ApolloClient } from "apollo-boost";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    posts: [],
    userPosts: [],
    searchResults: [],
    user: null,
    loading: false,
    error: null,
    authError: null,
    imageName: "",
    imageBase64: null,
    confirmed: null,
    downloadImagePath: ""
  },
  mutations: {
    setDownloadImagePath: (state, payload) => {
      state.downloadImagePath = payload;
    },
    setConfirmed: (state, payload) => {
      state.confirmed = payload;
      // console.log(state.confirmed);
    },
    setImageName: (state, payload) => {
      // console.log(payload);
      state.imageName = payload;
      // console.log(state.imageName);
    },
    setImageBase64: (state, payload) => {
      // console.log(payload);
      state.imageBase64 = payload;
      // console.log(state.imageBase64);
    },
    setPosts: (state, payload) => {
      state.posts = payload;
    },
    setSearchResults: (state, payload) => {
      if (payload !== null) {
        state.searchResults = payload;
      }
    },
    setUser: (state, payload) => {
      state.user = payload;
    },
    setUserPosts: (state, payload) => {
      state.userPosts = payload;
    },
    setLoading: (state, payload) => {
      state.loading = payload;
    },
    setError: (state, payload) => {
      state.error = payload;
    },
    setAuthError: (state, payload) => {
      state.authError = payload;
    },
    clearUser: state => (state.user = null),
    clearSearchResults: state => (state.searchResults = []),
    clearError: state => (state.error = null),
    clearImageName: state => (state.imageId = null),
    clearImageBase64: state => (state.imagebase64 = null)
    // clearEmailSent: state => (state.emailSent = null)
  },
  actions: {
    getCurrentUser: ({
      commit
    }) => {
      commit("setLoading", true);
      apolloClient
        .query({
          query: GET_CURRENT_USER
        })
        .then(({
          data
        }) => {
          commit("setLoading", false);
          // Add user data to state
          commit("setUser", data.getCurrentUser);
          // console.log(data.getCurrentUser);
        })
        .catch(err => {
          commit("setLoading", false);
          console.error(err);
        });
    },

    getPosts: ({
      commit
    }) => {
      commit("setLoading", true);
      apolloClient
        .query({
          query: GET_POSTS
        })
        .then(postsData => {
          // console.log(postsData);
          const {
            data
          } = postsData;
          commit("setPosts", data.getPosts);
          commit("setLoading", false);
        })
        .catch(err => {
          commit("setLoading", false);
          console.error(err);
        });
    },

    getUserPosts: ({
      commit
    }, payload) => {
      apolloClient
        .query({
          query: GET_USER_POSTS,
          variables: payload
        })
        .then(({
          data
        }) => {
          commit("setUserPosts", data.getUserPosts);
          // console.log(data.getUserPosts);
        })
        .catch(err => {
          console.error(err);
        });
    },

    searchPosts: ({
      commit
    }, payload) => {
      apolloClient
        .query({
          query: SEARCH_POSTS,
          variables: payload
        })
        .then(({
          data
        }) => {
          commit("setSearchResults", data.searchPosts);
        })
        .catch(err => console.error(err));
    },

    addPost: ({
      commit
    }, payload) => {
      apolloClient
        .mutate({
          mutation: ADD_POST,
          variables: payload,
          // update: (cache, { data: { addPost } }) => {
          //   // First read the query you want to update
          //   const data = cache.readQuery({ query: GET_POSTS });
          //   // console.log(data);
          //   // Create updated data
          //   data.getPosts.unshift(addPost);
          //   // Write updated data back to query
          //   // console.log(data);
          //   cache.writeQuery({
          //     query: GET_POSTS,
          //     data
          //   });
          // },
          // optimistic response ensures data is added immediately as we specified for the update function
          optimisticResponse: {
            __typename: "Mutation",
            addPost: {
              __typename: "Post",
              _id: -1,
              ...payload
            }
          },
          // Rerun specified queries after performing the mutation in order to get fresh data
          refetchQueries: [{
            query: INFINITE_SCROLL_POSTS,
            variables: {
              pageNum: 1,
              pageSize: 4
            }
          }]
        })
        .then(({
          data
        }) => {
          // console.log(data.addPost);
        })
        .catch(err => {
          console.error(err);
        });
    },

    updateUserPost: ({
      state,
      commit
    }, payload) => {
      apolloClient
        .mutate({
          mutation: UPDATE_USER_POST,
          variables: payload
        })
        .then(({
          data
        }) => {
          const index = state.userPosts.findIndex(
            post => post._id === data.updateUserPost._id
          );
          const userPosts = [
            ...state.userPosts.slice(0, index),
            data.updateUserPost,
            ...state.userPosts.slice(index + 1)
          ];
          commit("setUserPosts", userPosts);
        })
        .catch(err => {
          console.error(err);
        });
    },

    deleteUserPost: ({
      state,
      commit
    }, payload) => {
      apolloClient
        .mutate({
          mutation: DELETE_USER_POST,
          variables: payload
        })
        .then(({
          data
        }) => {
          const index = state.userPosts.findIndex(
            post => post._id === data.deleteUserPost._id
          );
          const userPosts = [
            ...state.userPosts.slice(0, index),
            ...state.userPosts.slice(index + 1)
          ];
          commit("setUserPosts", userPosts);
        })
        .catch(err => {
          console.error(err);
        });
    },

    signinUser: ({
      commit
    }, payload) => {
      commit("clearError");
      commit("setLoading", true);
      apolloClient
        .mutate({
          mutation: SIGNIN_USER,
          variables: payload
        })
        .then(({
          data
        }) => {
          commit("setLoading", false);
          localStorage.setItem("token", data.signinUser.token);
          // to make sure created method is run in main.js (we run getCurrentUser), reload the page
          if (data.signinUser.confirmed) {
            // console.log(data.signinUser.confirmed);
            commit("setConfirmed", data.signinUser.confirmed);
            router.go();
          } else {
            commit("setError", "Please finish email verification");
          }
        })
        .catch(err => {
          commit("setLoading", false);
          commit("setError", err);
          console.error(err);
        });
    },

    signupUser: ({
      commit
    }, payload) => {
      commit("clearError");
      commit("setLoading", true);
      apolloClient
        .mutate({
          mutation: SIGNUP_USER,
          variables: payload
        })
        .then(({
          data
        }) => {
          // console.log(data);
          commit("setLoading", false);
          localStorage.setItem("token", data.signupUser.token);
          // console.log(data.signinUser.emailSent);
          // commit("setEmailSent", data.signupUser.emailSent);
          // to make sure created method is run in main.js (we run getCurrentUser), reload the page
          // router.replace("/Signup");
        })
        .catch(err => {
          commit("setLoading", false);
          commit("setError", err);
          console.error(err);
        });
    },

    signoutUser: async ({
      commit
    }) => {
      // clear user in state
      commit("clearUser");
      // remove token in localStorage
      localStorage.setItem("token", "");
      // end session
      await apolloClient.resetStore();
      // redirect home - kick users out of private pages (i.e. profile)
      router.push("/");
    },

    uploadImage: ({
      commit
    }, payload) => {
      // console.log(payload);

      apolloClient
        .mutate({
          mutation: UPLOAD_IMAGE,
          variables: payload
        })
        .then(({
          data
        }) => {
          // console.log("image upload info");
          // console.log(data.uploadImage);
          // commit("clearImageName");
          commit("setImageName", data.uploadImage.filename);
          // commit("clearImageBase64");
          // commit("setImageBase64", data.uploadImage.imageBase64);

          // console.log(state.imageId);
        })
        .catch(err => console.error(err));
    },

    downloadImage: ({
      commit
    }, payload) => {
      apolloClient
        .mutate({
          mutation: DOWNLOAD_IMAGE,
          variables: payload
        })
        .then(({
          data
        }) => {
          console.log(data);
          commit("setDownloadImagePath", data.downloadImage.fileDir);
        });
    }
  },
  getters: {
    posts: state => state.posts,
    userPosts: state => state.userPosts,
    searchResults: state => state.searchResults,
    user: state => state.user,
    userFavorites: state => state.user && state.user.favorites,
    loading: state => state.loading,
    error: state => state.error,
    authError: state => state.authError,
    imageName: state => state.imageName,
    imageBase64: state => state.imageBase64,
    confirmed: state => state.confirmed,
    downloadImagePath: state => state.downloadImagePath
  }
});