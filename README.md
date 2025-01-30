# ADSB / Mode S Parser
Parses Mode S Extended Messages (so called ADSB messages)

### Dependencies
* none

### Test Coverage
see [coverage/lcov-report/index.html](coverage/lcov-report/index.html)

## Usage

[install via npm](https://www.npmjs.com/package/mode-s-adsb-parser):
```
npm i --save mode-s-adsb-parser
```


```typescript
TODO

// parsing does minimal work and just makes sure the structure is correct
parse()

// decodeLocation will only decode the location part of the message (so you can tell wether this is an interesting packet for you, and you want to fully decode it)
decodeLocation()


// fully decodes the message into values that is human readable, self explanatory and uses real world units
decode()
```

## Changelog

see [CHANGELOG.md](CHANGELOG.md)

# For Developers

see [DEV.md](DEV.md)
