<template>
  <div class="settings-view flex dark:text-white">
    <div class="aside w-48">
      <ul class="setting-list text-center border-r h-screen">
        <li class="setting-item h-12 flex items-center justify-center cursor-pointer"
          v-for="(label, keyName) in views"
          :key="keyName"
          :class="{
            'bg-blue-700': curView === keyName,
            'text-white': curView === keyName
          }"
          @click="curView=keyName">{{label}}</li>
      </ul>
    </div>
    <div class="main flex-1">
      <div v-if="curView === 'common'">
        <ul class="shortcut-list my-4">
          <li class="shortcut-item flex items-center">
            <div class="w-48 text-right mr-6">开机启动</div>
            <el-switch v-model="settings.launchAtLogin"
              :active-value="true"
              :inactive-value="false"
              @change="onLaunchAtLoginChange"
            />
          </li>
          <li class="flex items-center mt-4">
            <div class="w-48 text-right mr-6">快捷键</div>
            <ShortcutsRecorder v-model="settings.shortcuts" />
          </li>
          <li class="my-4 flex items-center">
            <div class="w-48 text-right mr-6">清除超时</div>
            <div class="w-64">
              <el-select v-model="settings.clearTimeout" class="flex-1">
                <el-option :value="0" label="即时"></el-option>
                <el-option :value="5" label="5 秒后"></el-option>
                <el-option :value="30" label="30 秒后"></el-option>
                <el-option :value="90" label="90 秒后"></el-option>
                <el-option :value="180" label="3 分钟后"></el-option>
                <el-option :value="600" label="10 分钟后"></el-option>
                <el-option :value="-1" label="永不"></el-option>
              </el-select>
            </div>
          </li>
        </ul>
      </div>
      <div v-else-if="curView==='plugins'">
        <div class="bg-gray-200 text-gray-600 px-2 py-2 flex justify-between items-center">
          插件管理
          <el-button :icon="Plus" circle size="small" @click="onAddPluginClick"></el-button>
        </div>
        <ul class="plugin-list">
          <li class="plugin-item"
            v-for="(plugin, index) in plugins"
            :key="plugin.path">
            <div class="plugin-item-self flex p-4 py-1 items-center">
              <el-icon class="mr-2 transform transition w-4"
                @click="onExpandPluginClick(plugin)"
                :class="{ 'rotate-90': expand[plugin.manifest.name] }"
              ><ArrowRightBold /></el-icon>
              <img :src="plugin.manifest.icon" alt="" class="w-8 h-8">
              <div class="info flex flex-col ml-4 justify-center">
                <h3 class="text-base">{{plugin.manifest.title}}</h3>
                <h5 class="text-gray-400 text-xs mt-1">{{plugin.manifest.subtitle}}</h5>
              </div>
              <div class="suffix ml-auto flex items-center">
                <el-switch :value="true" class="mr-4"></el-switch>
                <el-button type="danger" icon="el-icon-delete"
                  size="small"
                  @click="onRemovePluginClick(index, plugin)"
                  circle></el-button>
              </div>
            </div>
            <ul class="plugin-command-list pl-6" v-if="expand[plugin.manifest.name]">
              <li class="plugin-command-item flex p-4 py-3 items-center" v-for="command in plugin.commands" :key="command.name">
                <img :src="command.icon" alt="" class="w-8 h-8">
                <div class="info flex flex-col ml-4 justify-center w-48">
                  <h3 class="text-sm">{{command.title}}</h3>
                  <h5 class="text-gray-400 text-xs mt-1">{{command.subtitle}}</h5>
                </div>
                <div class="ml-2 w-16 text-center">
                  --
                </div>
                <div class="ml-6 w-28 text-center">
                  <ShortcutsRecorder v-model="command.shortcuts"></ShortcutsRecorder>
                </div>
                <div class="suffix ml-auto flex items-center">
                  <el-switch :value="true" size="small"></el-switch>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ElMessage, ElButton, ElSelect, ElSwitch, ElOption } from 'element-plus';
import { ArrowRightBold, Plus } from '@element-plus/icons-vue';
import ShortcutsRecorder from '@/components/ShortcutsRecorder.vue';

declare global {
  interface Window {
    bridge: any
  }
}

const views = ref({
  'common': '通用',
  'plugins': '插件设置',
})
const curView = ref('common')
const plugins = ref<IRunningPlugin[]>([])
const settings = ref<Record<string, any>>({})
const expand = ref<Record<string, boolean | undefined>>({})

const refreshSettings = async () => {
  window.bridge.invoke('getSettings').then((data: any) => {
    settings.value = data
  })
  window.bridge.invoke('getPlugins').then((data: IRunningPlugin[]) => {
    plugins.value = data
  })
}
const onLaunchAtLoginChange = async (launchAtLogin: any) => {
  settings.value.launchAtLogin = !!launchAtLogin
  await window.bridge.invoke('registerLaunchAtLogin', {
    settings: settings
  })
  refreshSettings()
}
const onExpandPluginClick = (plugin: IRunningPlugin) => {
  expand.value = {
    ...expand.value,
    [plugin.manifest.name]: !expand.value[plugin.manifest.name]
  }
}
const onAddPluginClick = async () => {
  const file = await new Promise<File>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.js'
    input.onchange = (e) => {
      // const [file] = e.target.files
      // if (!file) reject(new Error('no file selected'))
      resolve(file)
    }
    input.click()
  })

  const validateFile = (file: File) => {
    // try {
    //   const plugin = window.require(file.path)
    //   if (typeof plugin !== 'function' && typeof plugin.default !== 'function') {
    //     throw new Error('应该是一个函数')
    //   }
    // } catch(err) {
    //   ElMessage.error('导入插件失败')
    //   throw err
    // }
  }
  
  validateFile(file)

  // await window.bridge.invoke('registerPlugin', { path: file.path })
  ElMessage.success('插件添加成功')
  refreshSettings()
}

const onRemovePluginClick = async (index: number, plugin: IRunningPlugin) => {
  await window.bridge.invoke('removePlugin', { index, plugin })
  ElMessage.success('插件移除成功')
  refreshSettings()
}

refreshSettings()

</script>

<style lang="scss" scoped>
.settings-view {
  color-scheme: light dark;
  background-color: light-dark(#fff, #000);
}
</style>