#include <napi.h>
#include <Cocoa/Cocoa.h>

Napi::Object GetFrontmostAppInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // 创建结果对象
  Napi::Object result = Napi::Object::New(env);
  
  @autoreleasepool {
    NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
    NSRunningApplication *frontApp = [workspace frontmostApplication];
    
    printf("frontmost\n");  // macOS NSLog 更好但会污染输出
    
    if (frontApp) {
      NSString *appName = [frontApp localizedName] ?: @"Unknown";
      NSString *bundleIdentifier = [frontApp bundleIdentifier] ?: @"Unknown";
      
      // 设置对象属性
      result.Set("appName", 
                Napi::String::New(env, [appName UTF8String]));
                
      result.Set("bundleIdentifier", 
                Napi::String::New(env, [bundleIdentifier UTF8String]));
    } else {
      result.Set("appName", 
                Napi::String::New(env, "No frontmost application found"));
      result.Set("bundleIdentifier", 
                Napi::String::New(env, "Unknown"));
    }
  }
  
  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // 导出方法
  exports.Set("getFrontmostAppInfo", 
              Napi::Function::New(env, GetFrontmostAppInfo));
  return exports;
}

NODE_API_MODULE(addon, Init)