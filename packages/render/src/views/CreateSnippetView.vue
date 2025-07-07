<template>
  <div class="create-snippet-view">
    <h1>Create Snippet</h1>
    <el-form @submit.prevent="createSnippet" label-position="top">
      <el-form-item label="Title">
        <el-input autofocus type="text" v-model="formValue.title" placeholder="Title" />
      </el-form-item>
      <el-form-item label="Content">
        <el-input type="textarea" v-model="formValue.content" placeholder="Content" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="createSnippet">Create</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue'
import { ElInput, ElForm, ElFormItem, ElButton } from 'element-plus'

const formValue = ref({
  title: '',
  content: ''
})

const createSnippet = async () => {
  await window.PublicApp.mainAPI.db.run('INSERT INTO snippets (title, content) VALUES ($title, $content)', { ...toRaw(formValue.value) })
  window.publicApp.showHUD('创建成功')
  window.PublicApp.mainAPI.mainWindow.popToRoot()
}
</script>

<style lang="scss" scoped>
.create-snippet-view {
  padding: var(--nav-height) 16px 16px 16px;
}
</style>