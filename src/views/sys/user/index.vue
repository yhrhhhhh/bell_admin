<template>
  <div class="app-container">

    <el-row :gutter="20" class="header">
      <el-col :span="7">
        <el-input placeholder="请输入用户名..." v-model="queryForm.query" clearable></el-input>
      </el-col>
      <el-button type="primary" :icon="Search" @click="initUserList">搜索</el-button>
      <el-button type="success" :icon="DocumentAdd" @click="handleDialogValue()">新增</el-button>
    </el-row>

    <el-table :data="tableData" stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"/>
      <el-table-column prop="avatar" label="头像" width="80" align="center">
        <template v-slot="scope">
          <img 
            :src="getServerUrl() + 'media/userAvatar/' + (scope.row.avatar ? scope.row.avatar.split('/').pop().split('\\').pop() : 'default.jpg')" 
            width="50" 
            height="50"
            @error="(e) => e.target.src = getServerUrl() + 'media/userAvatar/default.jpg'"
          />
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="100" align="center"/>
      <el-table-column prop="email" label="邮箱" width="200" align="center"/>
      <el-table-column prop="phonenumber" label="手机号" width="120" align="center"/>
      <el-table-column prop="status" label="状态" width="200" align="center">
        <template v-slot="{row}">
          <el-switch v-model="row.status" @change="statusChangeHandle(row)" active-text="正常"
                     inactive-text="禁用" :active-value="true" :inactive-value="false"></el-switch>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="200" align="center"/>
      <el-table-column prop="login_date" label="最后登录时间" width="200" align="center"/>
      <el-table-column prop="remark" label="备注"/>
      <el-table-column prop="action" label="操作" width="200" fixed="right" align="center">
        <template v-slot="scope">
          <el-popconfirm v-if="scope.row.username!='python222'" title="您确定要对这个用户重置密码吗？"
                         @confirm="handleResetPassword(scope.row.id)">
            <template #reference>
              <el-button type="warning" :icon="RefreshRight">重置密码</el-button>
            </template>
          </el-popconfirm>

          <el-popconfirm v-if="scope.row.username!='python222'" title="您确定要删除这条记录吗？"
                         @confirm="handleDelete(scope.row.id)">
            <template #reference>
              <el-button type="danger" :icon="Delete"/>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>

    </el-table>
    <el-pagination
        v-model:current-page="queryForm.pageNum"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10, 20, 30, 40]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
    />
    <Dialog v-model="dialogVisible" :dialogVisible="dialogVisible" :id="id" :dialogTitle="dialogTitle"
            @initUserList="initUserList"></Dialog>
  </div>
</template>

<script setup>
import requestUtil,{getServerUrl} from '@/util/request'
import {Search, Delete, DocumentAdd, RefreshRight} from '@element-plus/icons-vue'
import {ref} from "vue";
import Dialog from './components/dialog'
import {ElMessage} from 'element-plus'

const tableData=ref([])
const total=ref(0)
const queryForm=ref({
  query:'',
  pageNum:1,
  pageSize:10
})

const dialogVisible = ref(false)

const dialogTitle = ref("")

const id = ref(-1)

const delBtnStatus = ref(true)

const multipleSelection = ref([])

const handleSelectionChange = (selection) => {
  console.log("勾选了")
  console.log(selection)
  multipleSelection.value = selection;
  delBtnStatus.value = selection.length == 0;
}

const handleDialogValue = (userId) => {
  if (userId) {
    id.value = userId;
    dialogTitle.value = "用户修改"
  } else {
    id.value = -1;
    dialogTitle.value = "用户添加"
  }
  dialogVisible.value = true
}

const initUserList=async ()=>{
  const res=await requestUtil.post("user/search",queryForm.value)
  tableData.value=res.data.userList
  total.value=res.data.total
}

const handleSizeChange=(pageSize)=>{
  queryForm.value.pageSize=pageSize
  queryForm.value.pageNum=1
  initUserList()
}

const handleCurrentChange=(pageNum)=>{
  queryForm.value.pageNum=pageNum
  initUserList()
}

const handleDelete = async (id) => {
  const res = await requestUtil.del("user/action", [id])
  if (res.data.code == 200) {
    ElMessage({
      type: 'success',
      message: '执行成功!'
    })
    initUserList();
  } else {
    ElMessage({
      type: 'error',
      message: res.data.msg,
    })
  }
}

const handleResetPassword = async (id) => {
  const res = await requestUtil.get("user/resetPassword?id=" + id)
  if (res.data.code == 200) {
    ElMessage({
      type: 'success',
      message: '执行成功!'
    })
    initUserList();
  } else {
    ElMessage({
      type: 'error',
      message: res.data.msg,
    })
  }
}

const statusChangeHandle = async (row) => {
  let res = await requestUtil.post("user/status", {id: row.id, status: row.status});
  if (res.data.code == 200) {
    ElMessage({
      type: 'success',
      message: '执行成功!'
    })
  } else {
    ElMessage({
      type: 'error',
      message: res.data.msg,
    })
    initUserList();
  }
}

initUserList()

</script>

<style lang="scss" scoped>

.header {
  padding-bottom: 16px;
  box-sizing: border-box;
}

.el-pagination {
  float: right;
  padding: 20px;
  box-sizing: border-box;
}

::v-deep th.el-table__cell {
  word-break: break-word;
  background-color: #f8f8f9 !important;
  color: #515a6e;
  height: 40px;
  font-size: 13px;

}

.el-tag--small {
  margin-left: 5px;
}
</style>
