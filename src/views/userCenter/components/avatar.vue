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
      <img v-if="imageUrl" :src="imageUrl" class="avatar"/>
      <el-icon v-else class="avatar-uploader-icon">
        <Plus/>
      </el-icon>
    </el-upload>
    <el-button @click="handleConfirm">确认更换</el-button>
  </el-form>


</template>

<script setup>
import {defineProps, ref, watch} from "vue";
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
      imageUrl.value = getServerUrl() + 'media/userAvatar/' + newUser.avatar
    }
  }
}, { immediate: true })

const handleAvatarSuccess = (res) => {
  if (res && res.title) {
    imageUrl.value = getServerUrl() + 'media/userAvatar/' + res.title
    form.value.avatar = res.title
  }
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('图片必须是jpg格式')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2M!')
    return false
  }
  return true
}

const handleConfirm = async () => {
  try {
    const result = await requestUtil.post("user/updateAvatar", form.value)
    const data = result.data
    if (data.code === 200) {
      ElMessage.success("更新头像成功！")
      // 更新localStorage中的用户信息
      const currentUser = JSON.parse(localStorage.getItem('currentUser'))
      if (currentUser) {
        currentUser.avatar = form.value.avatar
        localStorage.setItem('currentUser', JSON.stringify(currentUser))
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
