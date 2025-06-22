<template>
  <div class="plugin-prfs-view">
    <header class="plugin-prfs-view-header flex items-center">
      <div class="navBack material-symbols-outlined cursor-pointer"
        @pointerdown="exitCommand">
        arrow_back
      </div>
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
import { getPlugin, getPluginSettings, updatePluginSettings } from '@/services/manager';
import type { IPluginManifest, IPluginSettings } from '@public/shared';
import { ElForm, ElFormItem, ElInput, ElSelect, ElOption } from 'element-plus';
import { ref, shallowRef, toRaw, watch } from 'vue';

const props = defineProps<{ name: string }>();

const manifest = shallowRef<Omit<IPluginManifest, 'commands'>>()

let settings: IPluginSettings | null = null
const formValue = ref<Record<string, any>>({})

let inited = false
watch(formValue, () => {
  if (inited) {
    updatePluginSettings(props.name, { ...settings!, preferences: toRaw(formValue.value) || {} })
  }
}, { deep: true })

const refresh = () => {
  getPlugin(props.name)?.then(plugin => {
    console.log(props.name, plugin, props)
    manifest.value = plugin.manifest
  })
  getPluginSettings(props.name)?.then(result => {
    settings = { ...result }
    formValue.value = result.preferences || {}
    inited = true
  })
}

refresh()

const exitCommand = () => {
  window.publicApp.exit()
}

</script>

<style lang="scss" scoped>
.plugin-prfs-view {
  padding: 0 16px;
  .form-item-desc {
    opacity: 0.6;
    font-size: 13px;
  }
}
.plugin-prfs-view-header {
  height: 48px;
}
</style>