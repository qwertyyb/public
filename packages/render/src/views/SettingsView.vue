<template>
  <div class="settings-view">
    <ul class="panel-list">
      <li class="panel-item"
        v-for="(label, keyName) in views"
        :key="keyName"
        :class="{
          'active': curView === keyName,
        }"
        @click="curView=keyName">{{label}}</li>
    </ul>
    <div class="settings-view-main flex-1 h-full overflow-auto">
      <div v-if="curView === 'common'" class="settings-panel">
        <el-form label-width="180px">
          <el-form-item label="开机启动">
            <el-switch v-model="settings.launchAtLogin"
              :active-value="true"
              :inactive-value="false"
              @change="onLaunchAtLoginChange"
            />
          </el-form-item>
          <el-form-item label="快捷键">
            <ShortcutsRecorder v-model="settings.shortcuts"
              size="large"
              @update:model-value="onShortcutsChange"
              class="main-shortcuts"
            />
          </el-form-item>
          <el-form-item label="清除超时">
            <div class="w-64">
              <el-select v-model="settings.clearTimeout"
                @change="onClearTimeoutChange"
                style="width:200px">
                <el-option :value="0" label="即时"></el-option>
                <el-option :value="5" label="5 秒后"></el-option>
                <el-option :value="30" label="30 秒后"></el-option>
                <el-option :value="90" label="90 秒后"></el-option>
                <el-option :value="180" label="3 分钟后"></el-option>
                <el-option :value="600" label="10 分钟后"></el-option>
                <el-option :value="-1" label="永不"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div v-else-if="curView==='plugins'" class="settings-panel">
        <div class="panel-header">
          插件管理
          <el-button :icon="Plus" circle size="small" @click="onAddPluginClick"></el-button>
        </div>
        <ul class="plugin-list">
          <li class="plugin-item"
            v-for="(plugin, index) in plugins"
            :key="plugin.path">
            <div class="plugin-item-self">
              <el-icon class="plugin-expand-icon"
                :size="14"
                @click="onExpandPluginClick(plugin)"
                :class="{ expanded: expand[plugin.manifest.name], hidden: plugin.commands.length <= 0 }"
              ><ArrowRightBold /></el-icon>
              <img :src="plugin.manifest.icon" alt="" class="plugin-icon">
              <div class="plugin-info">
                <h3 class="plugin-title">{{plugin.manifest.title}}</h3>
                <p class="plugin-subtitle">{{plugin.manifest.subtitle}}</p>
              </div>
              <el-button :icon="Operation" circle
                class="action-item"
                size="small"
                v-if="plugin.manifest.preferences?.length"
                @click="openPrfsView(plugin.manifest.name)"
              ></el-button>
              <el-button type="danger" :icon="Delete"
                size="small"
                class="action-item"
                @click="onRemovePluginClick(index, plugin)"
                circle></el-button>
              <el-switch class="action-item"
                :model-value="plugin.settings?.disabled !== true"
                @update:model-value="onPluginDisabledChange($event as boolean, plugin)"
              ></el-switch>
            </div>
            <ul class="command-list" v-if="expand[plugin.manifest.name]">
              <li class="command-item"
                v-for="command in plugin.commands"
                :key="command.name">
                <img :src="command.icon" alt="" class="command-icon">
                <div class="command-info">
                  <h3 class="command-title">{{command.title}}</h3>
                  <h5 class="command-subtitle">{{command.subtitle}}</h5>
                </div>
                <div class="action-item">
                  <el-input size="small"
                    placeholder="别名"
                    :model-value="plugin.settings?.commands?.[command.name]?.alias ?? ''"
                    @update:model-value="onCommandChange({ alias: $event }, plugin, command)"
                  ></el-input>
                </div>
                <div class="action-item">
                  <ShortcutsRecorder
                    :model-value="plugin.settings?.commands?.[command.name]?.shortcuts ?? ''"
                    @update:model-value="onCommandChange({ shortcuts: $event }, plugin, command)"
                  ></ShortcutsRecorder>
                </div>
                <div class="action-item">
                  <el-switch
                    :model-value="!plugin.settings?.commands?.[command.name]?.disabled"
                    @update:model-value="onCommandChange({ disabled: !$event }, plugin, command)"
                    size="small"
                  ></el-switch>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div v-else-if="curView==='links'" class="settings-panel">
        <div class="panel-header">
          快捷链接
          <el-button :icon="Plus" circle size="small" @click="createLink"></el-button>
        </div>
        <ul class="link-list">
          <li class="link-item flex justify-between items-center" v-for="(item, index) in links" :key="index">
            <h3 class="link-title">{{ item.title }}</h3>
            <el-button type="danger" :icon="Delete"
              size="small"
              class="action-item"
              @click="removeLink(index)"
              circle></el-button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, toRaw } from 'vue';
import { ElMessage, ElButton, ElSelect, ElSwitch, ElOption, ElInput, ElForm, ElFormItem, ElIcon } from 'element-plus';
import { ArrowRightBold, Plus, Delete, Operation } from '@element-plus/icons-vue';
import ShortcutsRecorder from '@/components/ShortcutsRecorder.vue';
import type { ICommandSettings, IPluginCommand, IRunningPlugin } from '@public/shared';
import { getSettings, updateSettings, getPlugins, openPreferences, removePlugin, updateCommandSettings, updatePluginSettings, unregisterShortcuts, registerCommandShortcuts } from '@/services/settings';
import { onPageEnter, useRouter } from '@/router/hooks';

const views = ref({
  'common': '通用',
  'plugins': '插件设置',
  'links': '快捷链接'
})
const curView = ref('common')

const plugins = ref<IRunningPlugin[]>([])

const settings = ref<{
  launchAtLogin: boolean,
  shortcuts: string,
  clearTimeout: number,
}>({
  launchAtLogin: false,
  shortcuts: '',
  clearTimeout: 90,
})
const expand = ref<Record<string, boolean | undefined>>({})

interface ILink {
  trigger: string
  title: string
  link: string
}

const links = computed(() => {
  return plugins.value.find(i => i.manifest.name === 'links')?.settings?.preferences?.links as unknown as ILink[] || []
})

const refreshSettings = async () => {
  getSettings()?.then((data: any) => {
    settings.value = {
      ...settings.value,
      ...data
    }
    console.log('settings.value', settings.value)
  })
  getPlugins()?.then((data: IRunningPlugin[]) => {
    plugins.value = data
  })
}
const onLaunchAtLoginChange = async (launchAtLogin: any) => {
  settings.value.launchAtLogin = !!launchAtLogin
  await updateSettings({ launchAtLogin: settings.value.launchAtLogin })
  refreshSettings()
}
const onShortcutsChange = async (shortcuts: string) => {
  settings.value.shortcuts = shortcuts
  await updateSettings({ shortcuts: settings.value.shortcuts })
  refreshSettings()
}
const onClearTimeoutChange = async () => {
  await updateSettings({ clearTimeout: settings.value.clearTimeout })
  refreshSettings()
}
const onPluginDisabledChange = async (enabled: boolean, plugin: IRunningPlugin) => {
  console.log('plugin enabled', enabled)
  plugin.settings = { ...plugin.settings!, disabled: !enabled }
  await updatePluginSettings(plugin.manifest.name, { disabled: !enabled })
  refreshSettings()
}
const onCommandChange = async (values: Partial<ICommandSettings>, plugin: IRunningPlugin, command: IPluginCommand) => {
  if ('shortcuts' in values) {
    const original = plugin.settings?.commands?.[command.name]?.shortcuts
    if (original) {
      unregisterShortcuts(original)
    }
    if (values.shortcuts) {
      registerCommandShortcuts(values.shortcuts, plugin.manifest.name, command.name)
    }
  }
  plugin.settings!.commands![command.name] = { ...plugin.settings!.commands![command.name], ...values }
  await updateCommandSettings(plugin.manifest.name, command.name, { ...values })
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

  // await window.window.PublicAppBridge.invoke('registerPlugin', { path: file.path })
  ElMessage.success('插件添加成功')
  refreshSettings()
}

const onRemovePluginClick = async (index: number, plugin: IRunningPlugin) => {
  await removePlugin(plugin.manifest.name)
  ElMessage.success('插件移除成功')
  refreshSettings()
}

const openPrfsView = async (plugin: string, command?: string) => {
  if (plugin === 'links') {
    curView.value = 'links'
    return;
  }
  await openPreferences(plugin, command)
}

const router = useRouter()

const createLink = () => {
  console.log('router', router)
  router?.pushView('/plugin/link/create')
}

const removeLink = async (index: number) => {
  const preferences = plugins.value.find(i => i.manifest.name === 'links')?.settings?.preferences
  const newLinks = [...toRaw(links.value.filter((_, i) => i !== index))]
  await window.pluginManager?.updatePluginPreferences('links', { ...toRaw(preferences), links: newLinks })
  refreshSettings()
}

onPageEnter(() => {
  refreshSettings()
})

</script>

<style lang="scss" scoped>
.settings-view {
  height: 100vh;
  padding-top: var(--nav-height);
  box-sizing: border-box;
  display: flex;
}
.panel-list, .settings-view-main {
  height: 100%;
}
.panel-list {
  width: 200px;
  text-align: center;
  border-right: 1px solid var(--border-color);
  .panel-item {
    height: 42px;
    line-height: 42px;
    transition: background-color .2s;
    cursor: pointer;
    &.active {
      background-color: var(--selected-bg-color);
    }
  }
}
.settings-view-main {
  overflow: auto;
}
.settings-panel {
  height: 100%;
  .main-shortcuts {
    background: rgba(0, 0, 0, 0.15);
    &:deep(.keyboard-key) {
      background: none;
      font-size: 20px;
    }
  }
  .panel-header {
    height: 42px;
    background: rgba(0, 128, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
  }
  .plugin-item-self, .command-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
  }
  .plugin-expand-icon {
    transition: transform .2s;
    &.hidden {
      visibility: hidden;
    }
  }
  .plugin-expand-icon.expanded {
    transform: rotate(90deg);
  }
  .plugin-icon, .command-icon {
    width: 32px;
    height: 32px;
    margin-left: 8px;
  }
  .plugin-info, .command-info {
    margin-left: 12px;
    margin-right: auto;
  }
  .plugin-title, .command-title {
    font-size: 14px;
    font-weight: 500;
  }
  .plugin-subtitle, .command-subtitle {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.4;
    font-weight: 500;
  }
  .action-item + .action-item {
    margin-left: 12px;
  }
  .command-list {
    margin-left: 14px;
  }
}

.link-item {
  height: 48px;
  padding: 8px 16px;
  &:nth-child(even) {
    background: rgba(255, 255, 255, .03);
  }
  .link-title {
    font-size: 14px;
    font-weight: 500;
  }
}
</style>