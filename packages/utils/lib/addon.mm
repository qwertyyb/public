#include <napi.h>
#include <CoreFoundation/CoreFoundation.h>
#include <AppKit/AppKit.h>
#include <QuickLook/QuickLook.h>
#include <CoreServices/CoreServices.h>
#include "DictionaryKit/TTTDictionary.h"
#include "getIconForFile.h"

/**
 #   extern CFArrayRef DCSCopyRecordsForSearchString (DCSDictionaryRef, CFStringRef, unsigned long long, long long)
 #       unsigned long long method
 #           0   = exact match
 #           1   = forward match (prefix match)
 #           2   = partial query match (matching (leading) part of query; including ignoring diacritics, four tones in Chinese, etc)
 #           >=3 = ? (exact match?)
 #
 #       long long max_record_count
 */

extern CFArrayRef DCSCopyRecordsForSearchString(DCSDictionaryRef, CFStringRef, unsigned long long, long long);
extern CFArrayRef DCSCopyAvailableDictionaries(void);
extern CFDataRef DCSRecordCopyData(DCSDictionaryRef record);
extern CFArrayRef DCSGetActiveDictionaries(void);
extern DCSDictionaryRef DCSGetDefaultDictionary(void);

class MacAddon : public Napi::Addon<MacAddon> {
public:
  MacAddon(Napi::Env env, Napi::Object exports) {
    DefineAddon(exports, {
      InstanceMethod("getFrontmostAppInfo", &MacAddon::GetFrontmostAppInfo),
      InstanceMethod("getIconForFile", &MacAddon::InnerGetIconForFile),
      InstanceMethod("hanziToPinyin", &MacAddon::HanziToPinyin),
      InstanceMethod("lookupWord", &MacAddon::LookupWord),
      InstanceMethod("lookupWordHTML", &MacAddon::LookupWordHTML)
    });
  }

private:
  // 1. 获取前台应用信息
  Napi::Value GetFrontmostAppInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object result = Napi::Object::New(env);
    
    @autoreleasepool {
      NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
      NSRunningApplication *frontApp = [workspace frontmostApplication];
      
      if (frontApp) {
        NSString *appName = [frontApp localizedName] ?: @"Unknown";
        NSString *bundleIdentifier = [frontApp bundleIdentifier] ?: @"Unknown";
        
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
    
    return result; // 确保所有分支都返回了值
  }

  // 2. 获取文件图标 (异步)
  Napi::Value InnerGetIconForFile(const Napi::CallbackInfo& info) {
    return GetIconForFile(info);
  }

  // 3. 汉字转拼音 (同步)
  Napi::Value HanziToPinyin(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "需要参数: string").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 获取输入字符串
    std::string input = info[0].As<Napi::String>().Utf8Value();
    
    // 执行转换（在自动释放池中）
    __block Napi::Value result = env.Null();
    @autoreleasepool {
      result = ConvertHanziToPinyin(env, input);
    }
    
    return result;
  }

  // 4. 查询单词定义 (同步)
  Napi::Value LookupWord(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "需要参数: string").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 获取输入单词
    std::string word = info[0].As<Napi::String>().Utf8Value();
    
    // 在自动释放池中执行查询
    __block Napi::Value result = env.Null();
    @autoreleasepool {
      // 转换为 CFString
      CFStringRef cfWord = CFStringCreateWithCString(
        kCFAllocatorDefault,
        word.c_str(),
        kCFStringEncodingUTF8
      );
      
      if (!cfWord) {
        Napi::Error::New(env, "创建 CFString 失败").ThrowAsJavaScriptException();
        return env.Null();
      }
      
      // 查询单词定义
      CFRange range = DCSGetTermRangeInString(NULL, cfWord, 0);
      
      CFStringRef definition = DCSCopyTextDefinition(
        NULL,
        cfWord,
        range
      );
      
      if (definition) {
        // 转换定义为 C 字符串
        const char* cDefinition = CFStringGetCStringPtr(definition, kCFStringEncodingUTF8);
        if (cDefinition) {
          result = Napi::String::New(env, cDefinition);
        } else {
          // 如果直接获取失败，使用缓冲区
          CFIndex length = CFStringGetLength(definition);
          CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
          char* buffer = new char[maxSize];
          
          if (CFStringGetCString(definition, buffer, maxSize, kCFStringEncodingUTF8)) {
            result = Napi::String::New(env, buffer);
          }
          
          delete[] buffer;
        }
        
        CFRelease(definition);
      } else {
        result = Napi::String::New(env, "未找到定义");
      }
      
      CFRelease(cfWord);
    }
    
    return result;
  }

  // 4. 查询单词定义HTML (同步)
  Napi::Value LookupWordHTML(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "需要参数: string").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 获取输入单词
    std::string word = info[0].As<Napi::String>().Utf8Value();

    // 在自动释放池中执行查询
    Napi::Array result = Napi::Array::New(env);

    @autoreleasepool {
      // 转换为 NSString
      NSString *nsWord = [NSString stringWithUTF8String:word.c_str()];
      NSArray<TTTDictionary *> *dictionaries = [TTTDictionary activeDictionaries];

      for (TTTDictionary *dictionary in dictionaries) {
        Napi::Object jsResult = Napi::Object::New(env);
        jsResult.Set("dictionary", Napi::String::New(env, [dictionary.name UTF8String]));
        jsResult.Set("isUserDictionary", dictionary.isUserDictionary);
        Napi::Array entries = Napi::Array::New(env);
        for (TTTDictionaryEntry *entry in [dictionary entriesForSearchTerm:nsWord]) {
          Napi::Object jsEntry = Napi::Object::New(env);
          jsEntry.Set("headword", Napi::String::New(env, [entry.headword UTF8String]));
          jsEntry.Set("text", Napi::String::New(env, [entry.text UTF8String]));
          jsEntry.Set("html", Napi::String::New(env, [entry.HTML UTF8String]));
          jsEntry.Set("htmlWithAppCSS", Napi::String::New(env, [entry.HTMLWithAppCSS UTF8String]));
          jsEntry.Set("htmlWithPopoverCSS", Napi::String::New(env, [entry.HTMLWithPopoverCSS UTF8String]));

          entries.Set(entries.Length(), jsEntry);
        }
        jsResult.Set("entries", entries);
        result.Set(result.Length(), jsResult);
      }
    }
    
    return result;
  }
  
  // 核心转换逻辑
  Napi::Value ConvertHanziToPinyin(Napi::Env env, const std::string& input) {
    // 创建 CFString
    CFStringRef cfString = CFStringCreateWithBytes(
      kCFAllocatorDefault, 
      reinterpret_cast<const UInt8*>(input.c_str()), 
      input.length(), 
      kCFStringEncodingUTF8, 
      false
    );
    
    if (!cfString) {
      Napi::Error::New(env, "创建 CFString 失败").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 创建可变字符串
    CFMutableStringRef mutableString = CFStringCreateMutableCopy(NULL, 0, cfString);
    CFRelease(cfString);
    
    if (!mutableString) {
      Napi::Error::New(env, "创建可变字符串失败").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 转换为拼音（带音调）
    if (!CFStringTransform(mutableString, NULL, kCFStringTransformMandarinLatin, false)) {
      CFRelease(mutableString);
      Napi::Error::New(env, "汉字转拼音失败").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 去除音调符号
    if (!CFStringTransform(mutableString, NULL, kCFStringTransformStripDiacritics, false)) {
      CFRelease(mutableString);
      Napi::Error::New(env, "去除音调失败").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 准备缓冲区
    CFIndex length = CFStringGetLength(mutableString);
    CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
    char* buffer = new char[maxSize];
    
    // 转换为 C 字符串
    if (!CFStringGetCString(mutableString, buffer, maxSize, kCFStringEncodingUTF8)) {
      delete[] buffer;
      CFRelease(mutableString);
      Napi::Error::New(env, "字符串转换失败").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // 创建 JavaScript 字符串
    Napi::Value jsResult = Napi::String::New(env, buffer);
    
    // 清理
    delete[] buffer;
    CFRelease(mutableString);
    
    return jsResult;
  }
};

// 模块注册
NODE_API_ADDON(MacAddon)