# EntropyStudio example app

This is EntropyStudio's native React Native app. It uses Expo Modules and Expo
CLI so that [`@expo/ui`](https://docs.expo.dev/versions/latest/sdk/ui/) is
available, while retaining the checked-in Android and iOS projects and the
generated EntropyStudio UniFFI TurboModule. This is not an Expo Router,
Continuous Native Generation, or EAS migration.

The app is pinned to Expo SDK 57 and React Native 0.86.3. Its iOS deployment
target is 16.4.

## Install

First initialize the repository and install the Rust wrapper's dependencies:

```sh
git submodule update --init --recursive
npm install
```

Then install the example application's dependencies:

```sh
cd example
npm install
```

For iOS, install CocoaPods dependencies after the JavaScript install and after
any native dependency change:

```sh
bundle install
bundle exec pod install
```

## Run

Start Expo's Metro server from `example/`:

```sh
cd example
npm start
```

In another terminal, compile and launch the native app:

```sh
cd example
npm run android
# or
npm run ios
```

`npm start` uses Expo CLI for bundling, and `npm run android` / `npm run ios`
use Expo CLI to build the existing native projects. The platform scripts first
regenerate the Rust bridge, then compile the app. Native changes—including
adding or updating Expo modules or changing `@expo/ui`—require another platform
build. A Metro refresh only applies JavaScript changes.

## Expo Go is not supported

Do not open this project in Expo Go. Expo Go does not include EntropyStudio's
generated UniFFI/TurboModule native code, so it cannot load this application.
Use the local Android or iOS build commands above; they produce a custom native
app containing both the Expo modules and EntropyStudio bridge.

## Using `@expo/ui`

Import universal components from `@expo/ui` and place them inside a `Host`. The
host renders SwiftUI on iOS and Jetpack Compose on Android while leaving the
rest of the existing React Native screen intact.

```tsx
import { Button, Host } from '@expo/ui';

export function NativeButtonExample() {
  return (
    <Host matchContents>
      <Button label="Continue" onPress={() => {}} />
    </Host>
  );
}
```

Adopt these components incrementally. Existing React Native UI, navigation,
and EntropyStudio native-binding calls remain valid outside the `Host`.
