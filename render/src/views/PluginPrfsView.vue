<template>
  <div class="plugin-prfs-view">
    <header class="prfs-header">
      <img :src="manifest?.icon" alt="" class="prfs-image">
      <h2 class="prfs-title">{{ manifest?.title }}</h2>
      <p class="prfs-desc">{{ manifest?.descript }}</p>
      <p class="fill-desc">为保障功能正常使用，请先填写配置信息</p>
    </header>
    <el-form class="prfs-form"
      label-position="top"
    >
      <el-form-item class="prfs-form-item"
        :label="item.title"
        v-for="item in manifest?.preferences || []"
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
            :value="option.value" :label="option.title"
          ></el-option>
        </el-select>
        <p class="form-item-desc">{{ item.description }}</p>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { IPluginManifest } from '@public/shared';
import { ElForm, ElFormItem, ElInput, ElSelect, ElOption } from 'element-plus';
import { nextTick, ref, shallowRef, toRaw, watch } from 'vue';

const props = defineProps<{ plugin: string, command?: string }>();

const manifest = shallowRef<Omit<IPluginManifest, 'commands'>>()

const formValue = ref<Record<string, any>>({})

let inited = false
watch(formValue, () => {
  if (!inited) return;
  if (props.command) {
    window.pluginManager?.updateCommandPreferences(props.plugin, props.command, toRaw(formValue.value))
  } else {
    window.pluginManager?.updatePluginPreferences(props.plugin, toRaw(formValue.value))
  }
}, { deep: true })

const refresh = async () => {
  const plugin = window.pluginManager?.getPlugin(props.plugin)
  if (!plugin) return;
  manifest.value = plugin.manifest
  formValue.value = plugin.settings?.preferences || {}
  await nextTick()
  inited = true
}

refresh()

</script>

<style lang="scss" scoped>
.plugin-prfs-view {
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
    opacity: 0.6;
    font-size: 13px;
  }
  :deep(.prfs-form-item) {
    --el-fill-color-blank: none;
  }
}
</style>