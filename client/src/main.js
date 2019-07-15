import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import {
  VueMasonryPlugin
} from "vue-masonry";

import {
  ApolloClient
} from "apollo-client";
import {
  InMemoryCache
} from "apollo-cache-inmemory";
// import { HttpLink } from "apollo-link-http";
import {
  createUploadLink
} from "apollo-upload-client";
import {
  onError
} from "apollo-link-error";
// import { withClientState } from "apollo-link-state";
import {
  ApolloLink,
  Observable
} from "apollo-link";
import {
  WebSocketLink
} from "apollo-link-ws";
import {
  getMainDefinition
} from "apollo-utilities";
// import ApolloClient from "apollo-boost";
import VueApollo from "vue-apollo";

import FormAlert from "./components/Shared/FormAlert";

// Register Global Component
Vue.component("form-alert", FormAlert);
Vue.use(VueApollo);
Vue.use(VueMasonryPlugin);

// Setup ApolloClient

const request = operation => {
  // if no token with key of 'token' in localStorage, add it
  if (!localStorage.token) {
    localStorage.setItem("token", "");
  }

  // operation adds the token to an authorization header, which is sent to backend
  operation.setContext({
    headers: {
      authorization: localStorage.getItem("token")
    }
  });
};

// Setup the request handlers for the http clients
// const requestLink = new ApolloLink(
//   (operation, forward) =>
//     new Observable(observer => {
//       let handle;
//       Promise.resolve(operation)
//         .then(oper => request(oper))
//         .then(() => {
//           handle = forward(operation).subscribe({
//             next: observer.next.bind(observer),
//             error: observer.error.bind(observer),
//             complete: observer.complete.bind(observer)
//           });
//         })
//         .catch(observer.error.bind(observer));

//       return () => {
//         if (handle)
//         {handle.unsubscribe()}
//       };
//     })
// );

const requestLink = new ApolloLink((operation, forward) => {
  return new Observable(observer => {
    let handle;
    Promise.resolve(operation)
      .then(oper => {
        request(oper);
      })
      .then(() => {
        handle = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer)
        });
      })
      .catch(observer.error.bind(observer));

    return () => {
      if (handle) {
        handle.unsubscribe();
      }
    };
  });
});

// Web socket link for subscriptions
const wsLink = ApolloLink.from([
  onError(({
    graphQLErrors,
    networkError
  }) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        console.dir(err);
        console.log(
          `[GraphQL error]: Message: ${err.message}, Location: ${
            err.locations
          }, Path: ${err.path}`
        );
        if (err.name === "AuthenticationError") {
          // set auth error in state (to show in snackbar)
          store.commit("setAuthError", err);
          // signout user (to clear token)
          store.dispatch("signoutUser");
        }
      }
    }
    if (networkError) {
      console.log("[networkError]", networkError);
    }
  }),

  requestLink,

  // new createUploadLink({
  //   uri: "http://localhost:4000/graphql",
  //   credentials: "include"
  // }),

  new WebSocketLink({
    uri: `ws://localhost:4000/graphql`,
    options: {
      reconnect: true,
      connectionParams: () => {
        if (!localStorage.token) {
          localStorage.setItem("token", "");
        }
        if (localStorage.token) {
          const token = localStorage.getItem("token");
          return {
            Authorization: token
          };
        }
      }
    }
  })
]);

// HTTP link for queries and mutations
const httpLink = ApolloLink.from([
  onError(({
    graphQLErrors,
    networkError
  }) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        console.dir(err);
        if (err.name === "AuthenticationError") {
          // set auth error in state (to show in snackbar)
          store.commit("setAuthError", err);
          // signout user (to clear token)
          store.dispatch("signoutUser");
        }
      }
    }
    if (networkError) {
      console.log("[networkError]", networkError);
    }
  }),

  requestLink,

  new createUploadLink({
    uri: "http://localhost:4000/graphql",
    credentials: "include"
  })

  // new HttpLink({
  //   uri: "http://localhost:4000/graphql",
  //   credentials: "include"
  // })
]);

// Link to direct ws and http traffic to the correct place
const link = ApolloLink.split(
  // Pick which links get the data based on the operation kind
  ({
    query
  }) => {
    const {
      kind,
      operation
    } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  wsLink,
  httpLink
);

export const defaultClient = new ApolloClient({
  link,
  //  ApolloLink.from([
  //   onError(({ graphQLErrors, networkError }) => {
  //     if (graphQLErrors) {
  //       for (let err of graphQLErrors) {
  //         console.dir(err);
  //         if (err.name === "AuthenticationError") {
  //           // set auth error in state (to show in snackbar)
  //           store.commit("setAuthError", err);
  //           // signout user (to clear token)
  //           store.dispatch("signoutUser");
  //         }
  //       }
  //     }
  //     if (networkError) {
  //       console.log("[networkError]", networkError);
  //     }
  //   }),

  //   requestLink,

  // new createUploadLink({
  //   uri: "http://localhost:4000/graphql",
  //   credentials: "include"
  // }),
  // ]),

  cache: new InMemoryCache()
});

// Setup ApolloClient
// export const defaultClient = new ApolloClient({
//   uri: "http://localhost:4000/graphql",
//   // include auth token with requests made to backend
//   fetchOptions: {
//     credentials: "include"
//   },
//   request: operation => {
//     // if no token with key of 'token' in localStorage, add it
//     if (!localStorage.token) {
//       localStorage.setItem("token", "");
//     }

//     // operation adds the token to an authorization header, which is sent to backend
//     operation.setContext({
//       headers: {
//         authorization: localStorage.getItem("token")
//       }
//     });
//   },
// onError: ({ graphQLErrors, networkError }) => {
//   if (networkError) {
//     console.log("[networkError]", networkError);
//   }

//   if (graphQLErrors) {
//     for (let err of graphQLErrors) {
//       console.dir(err);
//       if (err.name === "AuthenticationError") {
//         // set auth error in state (to show in snackbar)
//         store.commit("setAuthError", err);
//         // signout user (to clear token)
//         store.dispatch("signoutUser");
//       }
//     }
//   }
// }
// });

const apolloProvider = new VueApollo({
  defaultClient
});

Vue.config.productionTip = false;

new Vue({
  apolloProvider,
  router,
  store,
  render: h => h(App),
  created() {
    // execute getCurrentUser query
    // window.addEventListener("offline", this.cleanToken);
    // localStorage.removeItem("token");
    this.$store.dispatch("getCurrentUser");
  },
  // mounted() {
  //   window.addEventListener("beforeunload", this.cleanToken);
  // },
  methods: {
    cleanToken() {
      console.log(localStorage.getItem("token"));
      localStorage.removeItem("token");
    }
  }
  // beforeDestroy() {
  // if (localStorage.getItem("token") !== "") {
  // localStorage.clear();
  // }
  // }
}).$mount("#app");