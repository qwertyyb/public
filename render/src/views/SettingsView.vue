<template>
  <div class="settings-view dark:text-white">
    <header class="settings-view-header flex items-center">
      <div class="navBack material-symbols-outlined cursor-pointer"
        @pointerdown="exitCommand">
        arrow_back
      </div>
    </header>
    <main class="settings-view-main  flex">
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
      <div class="main flex-1 h-full overflow-auto">
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
              <ShortcutsRecorder v-model="settings.shortcuts"
                @update:model-value="onShortcutsChange"
              />
            </li>
            <li class="my-4 flex items-center">
              <div class="w-48 text-right mr-6">清除超时</div>
              <div class="w-64">
                <el-select v-model="settings.clearTimeout"
                  @change="onClearTimeoutChange"
                  class="flex-1">
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
                <el-icon class="mr-2 transform transition w-4 cursor-pointer"
                  @click="onExpandPluginClick(plugin)"
                  :class="{ 'rotate-90': expand[plugin.manifest.name] }"
                ><ArrowRightBold /></el-icon>
                <img :src="plugin.manifest.icon" alt="" class="w-8 h-8">
                <div class="info flex flex-col ml-4 justify-center">
                  <h3 class="text-base">{{plugin.manifest.title}}</h3>
                  <h5 class="text-gray-600 text-xs mt-1">{{plugin.manifest.subtitle}}</h5>
                </div>
                <div class="suffix ml-auto flex items-center">
                  <el-button :icon="Operation" circle
                    class="mr-4"
                    v-if="plugin.manifest.preferences?.length"
                    @click="$router.push({ name: 'pluginPrfs', params: { name: plugin.manifest.name }})"
                  />
                  <el-switch class="mr-4"
                    :model-value="!settings.pluginsSettings[plugin.manifest.name]?.disabled"
                    @update:model-value="onPluginDisabledChange($event as boolean, plugin)"
                  ></el-switch>
                  <el-button type="danger" :icon="Delete"
                    size="small"
                    @click="onRemovePluginClick(index, plugin)"
                    circle></el-button>
                </div>
              </div>
              <ul class="plugin-command-list pl-6" v-if="expand[plugin.manifest.name]">
                <li class="plugin-command-item flex p-4 py-3 items-center"
                  v-for="command in plugin.commands"
                  :key="command.name">
                  <img :src="command.icon" alt="" class="w-8 h-8">
                  <div class="info flex flex-col ml-4 justify-center w-48">
                    <h3 class="text-sm">{{command.title}}</h3>
                    <h5 class="text-gray-400 text-xs mt-1">{{command.subtitle}}</h5>
                  </div>
                  <div class="ml-2 w-16 text-center">
                    <el-input size="small"
                      placeholder="别名"
                      :model-value="settings.pluginsSettings[plugin.manifest.name]?.commands?.[command.name]?.alias ?? ''"
                      @update:model-value="onCommandChange({ alias: $event }, plugin, command)"
                    ></el-input>
                  </div>
                  <div class="ml-6 w-28 flex justify-center">
                    <ShortcutsRecorder
                      :model-value="settings.pluginsSettings[plugin.manifest.name]?.commands?.[command.name]?.shortcuts ?? ''"
                      @update:model-value="onCommandChange({ shortcuts: $event }, plugin, command)"
                    ></ShortcutsRecorder>
                  </div>
                  <div class="suffix ml-auto flex items-center">
                    <el-switch
                      :model-value="!settings.pluginsSettings[plugin.manifest.name]?.commands?.[command.name]?.disabled"
                      @update:model-value="onCommandChange({ disabled: !$event }, plugin, command)"
                      size="small"
                    ></el-switch>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, toRaw } from 'vue';
import { ElMessage, ElButton, ElSelect, ElSwitch, ElOption, ElInput } from 'element-plus';
import { ArrowRightBold, Plus, Delete, Operation } from '@element-plus/icons-vue';
import ShortcutsRecorder from '@/components/ShortcutsRecorder.vue';
import type { ICommandSettings, IPluginCommand, IPluginSettings, IRunningPlugin } from '@public/shared';
// import { getPlugins, getSettings, registerLaunchAtLogin, registerShortcuts, removePlugin, updateSettings } from '@/services/manager';
import { createBridge } from '@public/utils'

const bridge = createBridge(
  (payload) => window.publicApp.sendToHost('bridgeMessage', payload),
  (callback) => window.publicApp.onHostMessage('bridgeMessage', (event, payload) => callback(payload)),
)

const views = ref({
  'common': '通用',
  'plugins': '插件设置',
})
const curView = ref('common')

const plugins = ref<IRunningPlugin[]>([])

const settings = ref<{
  launchAtLogin: boolean,
  shortcuts: string,
  clearTimeout: number,
  pluginsPathList: string[],
  pluginsSettings: Record<string, IPluginSettings>
}>({
  launchAtLogin: false,
  shortcuts: '',
  clearTimeout: 90,
  pluginsPathList: [],
  pluginsSettings: {}
})
const expand = ref<Record<string, boolean | undefined>>({})

const exitCommand = () => {
  window.publicApp.exit()
}

const refreshSettings = async () => {
  bridge.invoke('getSettings')?.then((data: any) => {
    settings.value = {
      ...settings.value,
      ...data
    }
    console.log('settings.value', settings.value)
  })
  bridge.invoke<IRunningPlugin[]>('getPlugins')?.then((data: IRunningPlugin[]) => {
    plugins.value = data
  })
}
const onLaunchAtLoginChange = async (launchAtLogin: any) => {
  settings.value.launchAtLogin = !!launchAtLogin
  await bridge.invoke('registerLaunchAtLogin', {
    settings: toRaw(settings.value)
  })
  refreshSettings()
}
const onShortcutsChange = async (shortcuts: string) => {
  settings.value.shortcuts = shortcuts
  await bridge.invoke('registerShortcuts', {
    settings: toRaw(settings.value)
  })
  refreshSettings()
}
const onClearTimeoutChange = async () => {
  await bridge.invoke('updateSettings', {
    settings: toRaw(settings.value)
  })
  refreshSettings()
}
const onPluginDisabledChange = async (enabled: boolean, plugin: IRunningPlugin) => {
  console.log('plugin enabled', enabled)
  settings.value.pluginsSettings[plugin.manifest.name] = {
    ...settings.value.pluginsSettings[plugin.manifest.name],
    disabled: !enabled
  }
  await bridge.invoke('updateSettings', {
    settings: toRaw(settings.value)
  })
  refreshSettings()
}
const onCommandChange = async (values: Partial<ICommandSettings>, plugin: IRunningPlugin, command: IPluginCommand) => {
  const origin = settings.value.pluginsSettings[plugin.manifest.name]
  settings.value.pluginsSettings[plugin.manifest.name] = {
    ...origin,
    commands: {
      ...origin?.commands,
      [command.name]: {
        ...origin?.commands?.[command.name],
        ...values
      }
    }
  }
  console.log(toRaw(settings.value))
  await bridge.invoke('updateSettings', {
    settings: toRaw(settings.value)
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
  await bridge.invoke('removePlugin', { index, plugin })
  ElMessage.success('插件移除成功')
  refreshSettings()
}

refreshSettings()

</script>

<style lang="scss" scoped>
.settings-view {
  color-scheme: light dark;
  // background-color: light-dark(#fff, #000);
  height: 486px;
}
.settings-view-header {
  height: 48px;
  padding: 0 16px;
}
</style>