#include <nan.h>
#include <Cocoa/Cocoa.h>

NAN_METHOD(GetFrontmostAppInfo) {
    v8::Local<v8::Object> result = Nan::New<v8::Object>();

    NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
    NSRunningApplication *frontApp = [workspace frontmostApplication];

    if (frontApp) {
        NSString *appName = [frontApp localizedName] ?: @"Unknown";
        NSString *bundleIdentifier = [frontApp bundleIdentifier] ?: @"Unknown";

        Nan::Set(result, Nan::New("appName").ToLocalChecked(), Nan::New([appName UTF8String]).ToLocalChecked());
        Nan::Set(result, Nan::New("bundleIdentifier").ToLocalChecked(), Nan::New([bundleIdentifier UTF8String]).ToLocalChecked());
    } else {
        Nan::Set(result, Nan::New("appName").ToLocalChecked(), Nan::New("No frontmost application found").ToLocalChecked());
        Nan::Set(result, Nan::New("bundleIdentifier").ToLocalChecked(), Nan::New("Unknown").ToLocalChecked());
    }

    info.GetReturnValue().Set(result);
}

NAN_MODULE_INIT(Init) {
    Nan::Set(target, Nan::New("getFrontmostAppInfo").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(GetFrontmostAppInfo)).ToLocalChecked());
}

NODE_MODULE(addon, Init)