# Covenant for JetBrains

IntelliJ Platform plugin scaffold for Covenant. Distributes via the
JetBrains Marketplace under plugin id `dev.covenant.jetbrains`.

## Build

```bash
./gradlew buildPlugin
```

The artifact is written to `build/distributions/`.

## Publish

```bash
PUBLISH_TOKEN=… ./gradlew publishPlugin
```

The release workflow `.github/workflows/publish-jetbrains.yml`
automates the publish on `jetbrains-v*.*.*` tags.

## License

Apache-2.0.
