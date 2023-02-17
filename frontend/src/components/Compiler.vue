<template>
  <div class="grid">
    <div class="input-container">
      <label for="inputBox" class="label">Code Input</label>
      <textarea id="inputBox" v-model="code" class="textarea"></textarea>
    </div>
    <div class="output-container">
      <label for="outputBox" class="label">Output</label>
      <textarea id="outputBox" :value="resultText" class="textarea" readonly></textarea>
      <div v-if="loading" class="loading">Please wait...</div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
    <button id="compButton" @click="compile" :disabled="loading" class="button">Compile and run</button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'cpp_compiler',
  data(){
    return {
      code: "",
      loading: false,
      error: null,
    }
  },
  computed: {
    resultText() {
      if (this.loading) {
        return "Please wait..."
      }
      if (this.error) {
        return this.error
      }
      return this.result
    }
  },
  methods:{
    compile: function (){
      if (!this.code.trim()) {
        return
      }
      this.loading = true
      this.error = null
      axios.post("http://localhost:1234/compiler",{
        code: this.code
      })
          .then(resp => {
            console.log(resp)
            this.result = resp.data.result
          })
          .catch(err => {
            console.log("Something went wrong")
            console.log(err)
            this.error = "Something went wrong"
          })
          .finally(() => {
            this.loading = false
          })
    }
  }
}
</script>
<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 2rem;
}

.input-container, .output-container {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.textarea {
  height: 400px;
  padding: 1rem;
  font-size: 1.2rem;
  line-height: 1.5;
  border: 2px solid #333;
  border-radius: 0.5rem;
  background-color: #f5f5f5;
}

.loading {
  margin-top: 0.5rem;
  font-size: 1.2rem;
  text-align: center;
}

.error {
  margin-top: 0.5rem;
  font-size: 1.2rem;
  color: #e60000;
  text-align: center;
}

.button {
  height: 100px;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  background-color: #333;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.button:hover, .button:focus {
  background-color: #666;
}

.button:active {
  background-color: #000;
}
</style>