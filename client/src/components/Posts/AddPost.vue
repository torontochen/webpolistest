<template>
  <v-container
    text-xs-center
    mt-5
    pt-5
  >

    <!-- Add Post Title -->
    <v-layout
      row
      wrap
    >
      <v-flex
        xs12
        sm6
        offset-sm3
      >
        <h1 class="primary--text">Add Post</h1>
      </v-flex>
    </v-layout>

    <!-- Add Post Form -->
    <v-layout
      row
      wrap
    >
      <v-flex
        xs12
        sm6
        offset-sm3
      >

        <v-form
          v-model="isFormValid"
          lazy-validation
          ref="form"
          @submit.prevent="handleAddPost"
        >

          <!-- Title Input -->
          <v-layout row>
            <v-flex xs12>
              <v-text-field
                :rules="titleRules"
                v-model="title"
                label="Post Title"
                type="text"
                required
              ></v-text-field>
            </v-flex>
          </v-layout>

          <!-- Image Url Input -->
          <v-layout row>
            <v-flex xs12>
              <v-btn
                raised
                class="primary"
                @click="onPickFile"
              >Upload Image</v-btn>
              <input
                type="file"
                style="display: none"
                ref="fileInput"
                accept="image/*"
                @change="onFilePicked"
              >
              <!-- <v-text-field :rules="imageRules" v-model="imageUrl" label="Image URL" type="text" required></v-text-field> -->
            </v-flex>
          </v-layout>

          <!-- Image Preview -->
          <v-layout row>
            <v-flex xs12>
              <img
                :src="imageUrl"
                height="300px"
              >
            </v-flex>
          </v-layout>

          <!-- Categories Select -->
          <v-layout row>
            <v-flex xs12>
              <v-select
                v-model="categories"
                :rules="categoriesRules"
                :items="['Art', 'Education', 'Food', 'Furniture', 'Travel', 'Photography', 'Technology']"
                multiple
                label="Categories"
              ></v-select>
            </v-flex>
          </v-layout>

          <!-- Description Text Area -->
          <v-layout row>
            <v-flex xs12>
              <v-textarea
                :rules="descRules"
                v-model="description"
                label="Description"
                type="text"
                required
              ></v-textarea>
            </v-flex>
          </v-layout>

          <v-layout row>
            <v-flex xs12>
              <v-btn
                :loading="loading"
                :disabled="!isFormValid || loading"
                color="info"
                type="submit"
              >
                <span
                  slot="loader"
                  class="custom-loader"
                >
                  <v-icon light>cached</v-icon>
                </span>
                Submit</v-btn>
            </v-flex>
          </v-layout>

        </v-form>

      </v-flex>
    </v-layout>

  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "AddPost",
  data() {
    return {
      mimetypeErr: false,
      isFormValid: true,
      title: "",
      imageId: "",
      imageUrl: "",
      categories: [],
      description: "",
      imageBase64: "",
      titleRules: [
        title => !!title || "Title is required",
        title => title.length < 20 || "Title must have less than 20 characters"
      ],
      // imageRules: [image => !!image || "Image is required"],
      categoriesRules: [
        categories =>
          categories.length >= 1 || "At least one category is required"
      ],
      descRules: [
        desc => !!desc || "Description is required",
        desc =>
          desc.length < 200 || "Description must have less than 200 characters"
      ]
    };
  },
  computed: {
    ...mapGetters(["loading", "user"])
  },
  methods: {
    handleAddPost() {
      this.imageName = this.$store.getters.imageName;
      this.imageBase64 = this.$store.getters.imageBase64;
      // console.log(this.imageBase64);
      if (this.$refs.form.validate()) {
        // add post action
        this.$store.dispatch("addPost", {
          title: this.title,
          imageName: this.imageName,
          categories: this.categories,
          description: this.description,
          creatorId: this.user._id,
          imageBase64: this.imageBase64
        });
        this.$router.push("/");
      }
    },
    onPickFile() {
      this.$refs.fileInput.click();
    },

    onFilePicked(event) {
      // const [file] = event.target.files;
      // console.log([file]);
      // console.log({ file });
      const files = event.target.files;
      console.log(files[0]);
      let filename = files[0].name;

      if (filename.lastIndexOf(".") <= 0) {
        return alert("Please add a valid file!");
      }
      if (files[0].type === 'image/jpeg' ||
          files[0].type === 'image/png' || files[0].type === 'image/jpg' || files[0].type === 'image/gif'  ) {
        const fileReader = new FileReader();
        fileReader.addEventListener("load", () => {
          this.imageUrl = fileReader.result;
        });
        fileReader.readAsDataURL(files[0]);
        // this.image = files[0];
        // console.log(files);
        // const formData = new FormData();
        // formData.append("file", files[0]);
        // console.log(this.user);
        this.$store.dispatch("uploadImage", {
          file: files[0],
          username: this.user.username
        });
      } else {
        return alert("Please add a image(jpeg,jpg,png,gif) file!");
      }
    }
  }
};
</script>
