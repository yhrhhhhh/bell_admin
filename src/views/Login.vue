<template>
  <div class="login">

    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title">Bell</h3>

      <el-form-item prop="username">

        <el-input
            v-model="loginForm.username"
            type="text"
            size="large"
            auto-complete="off"
            placeholder="账号"
        >
          <template #prefix><svg-icon icon="user" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            auto-complete="off"
            placeholder="密码"
        >
          <template #prefix><svg-icon icon="password" /></template>
        </el-input>
      </el-form-item>


      <el-checkbox v-model="loginForm.rememberMe" style="margin:0px 0px 25px 0px;">记住密码</el-checkbox>
      <el-form-item style="width:100%;">
        <el-button
            size="large"
            type="primary"
            style="width:100%;"
            @click.prevent="handleLogin"
        >
          <span>登 录</span>

        </el-button>

      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
  import {ref, onMounted} from 'vue'
  import requestUtil from '@/util/request'
  import qs from 'qs'
  import {ElMessage} from 'element-plus'
  import Cookies from "js-cookie";
  import { encrypt, decrypt } from "@/util/jsencrypt";
  import router from '@/router'
  import store from '@/store'


  const loginForm=ref({
    username:'',
    password:'',
    rememberMe:false
  })

  const loginRef=ref(null)

  const loginRules = {
    username: [{required: true, trigger: "blur", message: "请输入您的账号"}],
    password: [{required: true, trigger: "blur", message: "请输入您的密码"}]
  };

  const handleLogin = async () => {
    try {
      await loginRef.value.validate()
      const result = await requestUtil.post("user/login/", loginForm.value)
      const data = result.data
      if (data.code === 200) {
        ElMessage.success(data.info)
        const token = data.token
        const userInfo = data.user
        
        const storeUserInfo = () => {
          localStorage.setItem("token", token)
          sessionStorage.setItem("token", token)
          localStorage.setItem("currentUser", JSON.stringify(userInfo))
          sessionStorage.setItem("currentUser", JSON.stringify(userInfo))
        }
        
        storeUserInfo()
        
        if (loginForm.value.rememberMe) {
          Cookies.set("username", loginForm.value.username, { expires: 30 })
          Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
          Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
        } else {
          Cookies.remove("username")
          Cookies.remove("password")
          Cookies.remove("rememberMe")
        }
        
        store.commit('ADD_TABS', {
          name: '外机控制面板',
          path: '/bsns/department'
        })
        router.push('/bsns/department')
      } else {
        ElMessage.error(data.info || '登录失败')
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败，请重试')
    }
  }

  // 检查是否可以自动登录
  const checkAutoLogin = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    const userInfo = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser")
    const rememberMe = Cookies.get("rememberMe")
    
    if (token && userInfo && rememberMe) {
      const username = Cookies.get("username")
      const password = decrypt(Cookies.get("password"))
      if (username && password) {
        loginForm.value = {
          username,
          password,
          rememberMe: true
        }
        handleLogin()
      }
    }
  }

  function getCookie() {
    const username = Cookies.get("username");
    const password = Cookies.get("password");
    const rememberMe = Cookies.get("rememberMe");
    loginForm.value = {
      username: username === undefined ? loginForm.value.username : username,
      password: password === undefined ? loginForm.value.password : decrypt(password),
      rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
    };
  }

  onMounted(() => {
    getCookie()
    checkAutoLogin()
  })

</script>

<style lang="scss" scoped>
a{
  color:white
}
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url("../assets/images/login-background.jpg");
  background-size: cover;
}
.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #707070;
}

.login-form {
  border-radius: 6px;
  background: #ffffff;
  width: 400px;
  padding: 25px 25px 5px 25px;

  .el-input {
    height: 40px;



    input {
      display: inline-block;
      height: 40px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }

}
.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}
.login-code {
  width: 33%;
  height: 40px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}
.login-code-img {
  height: 40px;
  padding-left: 12px;
}
</style>
