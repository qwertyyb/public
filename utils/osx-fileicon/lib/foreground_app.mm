#include <nan.h>
#include <ApplicationServices/ApplicationServices.h>
#import <Cocoa/Cocoa.h>

NAN_METHOD(GetForegroundAppBundleIdentifier) {
  if (info.Length() < 1 || !info[0]->IsArray()) {
    Nan::ThrowTypeError("Expected an array of strings as the first argument");
    return;
  }

  v8::Local<v8::Array> filterArray = v8::Local<v8::Array>::Cast(info[0]);
  std::vector<std::string> filterBundleIdentifiers;

  for (uint32_t i = 0; i < filterArray->Length(); i++) {
    if (Nan::Has(filterArray, i).FromJust()) {
      v8::Local<v8::Value> val = Nan::Get(filterArray, i).ToLocalChecked();
      if (val->IsString()) {
        v8::String::Utf8Value utf8Value(info.GetIsolate(), val);
        filterBundleIdentifiers.push_back(std::string(*utf8Value));
      }
    }
  }

  // Get the frontmost application
  CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly, kCGNullWindowID);
  CFDictionaryRef windowInfo = nullptr;
  pid_t pid = 0;

  for (CFIndex i = 0; i < CFArrayGetCount(windowList); i++) {
    windowInfo = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);
    CFNumberRef pidRef = (CFNumberRef)CFDictionaryGetValue(windowInfo, kCGWindowOwnerPID);
    CFNumberGetValue(pidRef, kCFNumberIntType, &pid);

    NSRunningApplication *app = [NSRunningApplication runningApplicationWithProcessIdentifier:pid];
    NSString *bundleIdentifier = [app bundleIdentifier];

    if (bundleIdentifier) {
      std::string bundleIdentifierStr([bundleIdentifier UTF8String]);
      if (std::find(filterBundleIdentifiers.begin(), filterBundleIdentifiers.end(), bundleIdentifierStr) == filterBundleIdentifiers.end()) {
        v8::Local<v8::String> result = Nan::New(bundleIdentifierStr).ToLocalChecked();
        info.GetReturnValue().Set(result);
        CFRelease(windowList);
        return;
      }
    }
  }

  CFRelease(windowList);
  info.GetReturnValue().Set(Nan::Null());
}

NAN_MODULE_INIT(Init) {
  Nan::Set(target, Nan::New("getForegroundAppBundleIdentifier").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(GetForegroundAppBundleIdentifier)).ToLocalChecked());
}

NODE_MODULE(foreground_app, Init)