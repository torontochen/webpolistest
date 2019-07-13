<template>
  <v-container text-xs-center>
    <!-- Loading Spinner -->
    <v-layout row>
      <v-dialog
        v-model="loading"
        persistent
        fullscreen
      >
        <v-container fill-height>
          <v-layout
            row
            justify-center
            align-center
          >
            <v-progress-circular
              indeterminate
              :size="70"
              :width="7"
              color="secondary"
            ></v-progress-circular>
          </v-layout>
        </v-container>
      </v-dialog>
    </v-layout>

    <!-- Explore Posts Button -->
    <v-layout
      class="mt-2 mb-3"
      row
      wrap
      v-if="!loading"
    >
      <v-flex xs12>
        <v-btn
          class="secondary"
          to="/posts"
          large
          dark
        >
          Explore Posts
        </v-btn>
      </v-flex>
    </v-layout>

    <!-- Posts Carousel -->
    <v-flex xs12>
      <v-carousel
        v-if="!loading && posts.length > 0"
        v-bind="{ 'cycle': true }"
        interval="3000"
      >
        <v-carousel-item
          v-for="post in posts"
          :key="post._id"
          :src="post.imageBase64"
          @click.native="goToPost(post._id)"
        >
          <h1 id="carousel__title">{{post.title}}</h1>
        </v-carousel-item>
      </v-carousel>
    </v-flex>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import { POST_ADDED } from "../queries";

export default {
  name: "home",
  data() {
    return {
      newPosts: ""
    };
  },
  created() {
    this.handleGetCarouselPosts();
  },
  apollo: {
    $subscribe: {
      postAdded: {
        query: POST_ADDED,
        result({ data }) {
          // console.log(data.postAdded);
          // console.log(this.posts);
          this.newPosts = this.posts.push(data.postAdded);
          // console.log(this.posts.push(data.postAdded));
          this.$store.commit("setPosts", this.posts);
          // this.$store.getters.posts;
          // console.log(this.ca);
          // this.carouselPosts = this.carouselPosts.unshift(data.postAdded);
        }
      }
    }
    // getPosts:{
    //   query:GET_POSTS,
    //   subscribeToMore: {
    //     document: POST_ADDED,
    //     updateQuery:(previousResult,{subscritpionData}) => {
    //       console.log(previousResult);
    //       console.log(subscritpionData);
    //     }
    //   }
    // }
  },
  computed: {
    ...mapGetters(["loading", "posts"])
    // carouselPosts() {
    //   return this.posts;
    // }
  },
  methods: {
    handleGetCarouselPosts() {
      // reach out to Vuex store, fire action that gets posts for carousel
      this.$store.dispatch("getPosts");
    },
    goToPost(postId) {
      this.$router.push(`/posts/${postId}`);
    }
  }
};
</script>

<style>
#carousel__title {
  position: absolute;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 5px 5px 0 0;
  padding: 0.5em;
  margin: 0 auto;
  bottom: 50px;
  left: 0;
  right: 0;
}
</style>
