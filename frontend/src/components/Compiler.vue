<template>
  <div class="container">
    <div class="form-container">
      <h2 class="form-heading">Code Input</h2>
      <div class="form-group">
        <textarea id="inputBox" v-model="code" class="form-control"></textarea>
      </div>
      <button id="compButton" @click="compile" :disabled="showSpinner" class="btn btn-primary">Compile and run</button>
    </div>
    <div class="result-container">
      <h2 class="result-heading">Output</h2>
      <div v-if="showSpinner" class="spinner"></div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="result" class="result">{{ result }}</div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "cpp_compiler",
  data() {
    return {
      code: "",
      result: "",
      showSpinner: false,
      error: null,
    };
  },
  methods: {
    compile() {
      if (!this.code.trim()) {
        return;
      }
      this.error = null;
      this.showSpinner = true;
      axios.post("http://localhost:1234/compiler", {
            code: this.code,
          })
          .then((resp) => {
            console.log(resp);
            this.result = resp.data.result;
          })
          .catch((err) => {
            console.log("Something went wrong");
            console.log(err);
            this.error = "Something went wrong";
          })
          .finally(() => {
            this.loading = false;
            this.showSpinner = false;
          });
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  background-color: #f5f5f5;
}

.form-container,
.result-container {
  flex: 1 1 400px;
  margin: 1rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: #fff;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.form-heading,
.result-heading {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-control {
  display: block;
  width: 100%;
  height: 300px;
  padding: 1rem;
  font-size: 1.5rem;
  line-height: 1.5;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #4d90fe;
  box-shadow: 0 0 0 0.2rem rgba(77, 144, 254, 0.25);
}

.btn {
  display: inline-block;
  margin-bottom: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: black;
  text-align: center;
  vertical-align: center;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #333;
  animation: spin 1s linear infinite;

}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>