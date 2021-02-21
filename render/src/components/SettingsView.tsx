import React from 'react'
import { Layout, Menu, List, Avatar } from 'antd'
import { AppstoreAddOutlined, FunctionOutlined, RightOutlined } from '@ant-design/icons'
const { Sider, Header, Content } = Layout

export default class SettingsView extends React.Component {
  state = {
    plugins: window.PluginManager.getPlugins()
  }
  render() {
    return (
      <div className="settings-view flex h-screen">
        <Layout>
          <Header>
            <div className="text-center text-white">设置</div>
          </Header>
          <Layout>
            <Sider>
            <Menu theme="dark" mode="vertical" defaultSelectedKeys={['plugin']}>
              <Menu.Item key="plugin"
                className="flex items-center">
                <div className="flex items-center">
                  <AppstoreAddOutlined style={{fontSize: '12px'}} />
                  插件
                </div>
              </Menu.Item>
              <Menu.Item key="2">
                <div className="flex items-center">
                  <FunctionOutlined />
                  快捷键
                </div>
              </Menu.Item>
            </Menu>
            </Sider>
            <Content>
              <div className="plugin-setting-content px-3">
                <List>
                  {
                    this.state.plugins.map(plugin => (
                      <List.Item key={plugin.icon}>
                        <List.Item.Meta
                          avatar={<Avatar size={46} src={plugin.icon} />}
                          title={plugin.title}
                          description={plugin.subtitle}
                        ></List.Item.Meta>
                        <RightOutlined style={{fontSize: '16px', color: '#999'}}/>
                      </List.Item>
                    ))
                  }
                </List>
              </div>
            </Content>
          </Layout>
        </Layout>
      </div>
    )
  }
}