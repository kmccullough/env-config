# env-config

Parses environment config file/string with variable replacements

## Installation

```bash
$ npm install @kmccullough/env-config
```

## Usage

```bash
# Example environment config file/string
USER=1234
PASS=2345
CREDENTIALS=${USER}:${PASS}
```

```js
loadConfig([ '.env', '.env-default' ], {
  // Path to prefix all given paths 
  rootPath: './',
  // Called for each file in given paths
  eachFileFn(fileExists, filePath, fullFilePath, skip, done) {
    skip(); // Skip parsing this file
    done(); // Stop parsing all files after this one
  },
  // Called for each config key value pair
  eachFileFn(key, value, skip, done) {
    skip(); // Skip this value in returned config (and replacements)
    done(); // Stop parsing configs after this one from this file
  },
})
```

## License

[MIT](./LICENSE.txt)
