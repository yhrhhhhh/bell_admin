<template>
  <el-form
      ref="formRef"
      :model="form"
      label-width="100px"
      style="text-align: center;padding-bottom:10px"
  >
    <el-upload
        name="avatar"
        :headers="headers"
        class="avatar-uploader"
        :action="getServerUrl()+'user/uploadImage'"
        :show-file-list="false"
        :on-success="handleAvatarSuccess"
        :before-upload="beforeAvatarUpload"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" @error="handleImageError"/>
      <el-icon v-else class="avatar-uploader-icon">
        <Plus/>
      </el-icon>
    </el-upload>
    <el-button @click="handleConfirm">确认更换</el-button>
  </el-form>


</template>

<script setup>
import {defineProps, ref, watch, getCurrentInstance} from "vue";
import requestUtil, {getServerUrl} from "@/util/request";
import {ElMessage} from 'element-plus'
import {Plus} from '@element-plus/icons-vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const headers = ref({
  Authorization: localStorage.getItem('token')
})

const form = ref({
  id: -1,
  avatar: ''
})

const formRef = ref(null)
const imageUrl = ref("")

// 使用watch监听props.user的变化
watch(() => props.user, (newUser) => {
  if (newUser) {
    form.value = { ...newUser }
    if (newUser.avatar) {
      // 构建完整的头像URL，确保只使用文件名
      const fileName = newUser.avatar.split('/').pop().split('\\').pop()
      imageUrl.value = `${getServerUrl()}media/userAvatar/${fileName}`
    } else {
      imageUrl.value = `${getServerUrl()}media/userAvatar/default.jpg`
    }
  }
}, { immediate: true })

const handleAvatarSuccess = (res) => {
  if (res && res.title) {
    // 只存储文件名，不包含路径
    const fileName = res.title.split('/').pop().split('\\').pop()
    imageUrl.value = `${getServerUrl()}media/userAvatar/${fileName}`
    form.value.avatar = fileName
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error('上传失败：服务器返回数据格式错误')
    handleImageError()
  }
}

const beforeAvatarUpload = (file) => {
  const isValidFormat = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isValidFormat) {
    ElMessage.error('头像必须是JPG/PNG/GIF格式')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过2MB')
    return false
  }
  return true
}

const handleImageError = () => {
  imageUrl.value = `${getServerUrl()}media/userAvatar/default.jpg`
  ElMessage.warning('头像加载失败，已使用默认头像')
}

const handleConfirm = async () => {
  try {
    const result = await requestUtil.post("user/updateAvatar", form.value)
    const data = result.data
    if (data.code === 200) {
      ElMessage.success("更新头像成功！")
      // 更新localStorage和sessionStorage中的用户信息
      const currentUser = JSON.parse(localStorage.getItem('currentUser'))
      if (currentUser) {
        currentUser.avatar = form.value.avatar  // 只存储文件名
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser))
      }
      // 通知父组件刷新用户信息
      const userCenter = getCurrentInstance()?.parent
      if (userCenter?.exposed?.refreshUserInfo) {
        await userCenter.exposed.refreshUserInfo()
      }
    } else {
      ElMessage.error(data.errorInfo || '更新头像失败')
    }
  } catch (error) {
    console.error('更新头像失败:', error)
    ElMessage.error('更新头像失败，请重试')
  }
}
</script>

<style>

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}


</style>
