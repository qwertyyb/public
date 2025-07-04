<template>
  <div class="create-link-view">
    <header class="prfs-header">
      <h2 class="prfs-title">创建 Link</h2>
    </header>
    <el-form class="prfs-form"
      label-position="top"
    >
      <el-form-item class="prfs-form-item"
        :label="item.title"
        v-for="item in preferences"
        :key="item.name"
        :required="item.required"
      >
        <el-input v-if="item.type === 'text' || item.type === 'textarea'"
          :placeholder="item.placeholder"
          v-model="formValue[item.name]"
        ></el-input>
        <el-select v-if="item.type === 'select'"
          v-model="formValue[item.name]"
          :placeholder="item.placeholder"
        >
          <el-option v-for="option in item.options || []"
            :key="option.value"
            :value="option.value" :label="option.label"
          ></el-option>
        </el-select>
        <p class="form-item-desc">{{ item.description }}</p>
      </el-form-item>
      <el-form-item class="btn-item">
        <el-button type="primary" style="margin: 0 auto" :disabled="btnDisabled" @click="confirm">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton } from 'element-plus';
import { computed, ref, shallowRef, toRaw } from 'vue';

const plugin = 'link'

const preferences = shallowRef<{
  name: string,
  title: string,
  description?: string,
  type: 'text' | 'textarea' | 'select',
  required?: boolean,
  placeholder?: string,
  options?: { value: string, label: string }[]
}[]>([
  { name: 'trigger', title: '触发词', type: 'text', required: true, placeholder: '请输入触发关键词' },
  { name: 'title', title: '标题', type: 'text', required: true, placeholder: '请输入标题' },
  { name: 'url', title: '链接', type: 'text', required: true, placeholder: '请输入链接', description: '请输入链接, 可用$query代表查询词' },
])

const formValue = ref<Record<string, any>>({})

const btnDisabled = computed(() => {
  const requiredFields = preferences.value.filter(item => item.required)
  return requiredFields.some(item => !formValue.value[item.name])
})

const confirm = () => {
  console.log('formValue', formValue.value)
  const { links, ...rest } = window.pluginManager?.getPluginPreferences(plugin) || {}
  window.pluginManager?.updatePluginPreferences(plugin, { ...rest, links: [...links, { ...toRaw(formValue.value) }] })
}

</script>

<style lang="scss" scoped>
.create-link-view {
  padding: 48px 16px;

  .prfs-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 24px;
  }
  .prfs-image {
    width: 48px;
    height: 48px;
  }
  .prfs-title {
    margin-top: 16px;
  }
  .fill-desc {
    opacity: 0.4;
    font-size: 14px;
  }

  .form-item-desc {
    opacity: 0.4;
    font-size: 12px;
  }
  :deep(.prfs-form-item) {
    --el-fill-color-blank: none;
  }
}
</style>