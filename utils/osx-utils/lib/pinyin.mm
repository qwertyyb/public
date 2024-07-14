#include <nan.h>
#include <CoreFoundation/CoreFoundation.h>

void HanziToPinyin(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1 || !info[0]->IsString()) {
    Nan::ThrowTypeError("Wrong arguments");
    return;
  }

  v8::Isolate* isolate = info.GetIsolate();
  v8::Local<v8::Context> context = isolate->GetCurrentContext();
  v8::String::Utf8Value input(isolate, info[0]);

  CFStringRef cfString = CFStringCreateWithCString(kCFAllocatorDefault, *input, kCFStringEncodingUTF8);

  if (cfString == NULL) {
    Nan::ThrowError("Failed to create CFString");
    return;
  }

  // Create a mutable copy of the CFString
  CFMutableStringRef mutableString = CFStringCreateMutableCopy(NULL, 0, cfString);
  CFRelease(cfString);

  if (mutableString == NULL) {
    Nan::ThrowError("Failed to create mutable CFString");
    return;
  }

  // Transform the string to Pinyin with tone marks
  bool success = CFStringTransform(mutableString, NULL, kCFStringTransformMandarinLatin, false);
  if (!success) {
    CFRelease(mutableString);
    Nan::ThrowError("Failed to transform string to Pinyin");
    return;
  }

  // Remove the tone marks
  success = CFStringTransform(mutableString, NULL, kCFStringTransformStripDiacritics, false);
  if (!success) {
    CFRelease(mutableString);
    Nan::ThrowError("Failed to strip diacritics");
    return;
  }

  CFIndex length = CFStringGetLength(mutableString);
  CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8);
  char* buffer = (char*)malloc(maxSize + 1);
  if (buffer == NULL) {
    CFRelease(mutableString);
    Nan::ThrowError("Failed to allocate memory");
    return;
  }

  if (!CFStringGetCString(mutableString, buffer, maxSize + 1, kCFStringEncodingUTF8)) {
    free(buffer);
    CFRelease(mutableString);
    Nan::ThrowError("Failed to convert CFString to C string");
    return;
  }

  info.GetReturnValue().Set(Nan::New(buffer).ToLocalChecked());

  free(buffer);
  CFRelease(mutableString);
}

NAN_MODULE_INIT(Init) {
  Nan::Set(target, Nan::New("hanziToPinyin").ToLocalChecked(),
           Nan::GetFunction(Nan::New<v8::FunctionTemplate>(HanziToPinyin)).ToLocalChecked());
}

NODE_MODULE_CONTEXT_AWARE(pinyin, Init)