---
title: Automated Posting Bot
---

# Automated Posting Bot

The Automated Posting Bot provide powerful automation capabilities for fansly, f2f, fancentro

## Features

- [Upload Contents]
- [Post Articles]
- [Comment Articles]
- [Follow Articles]
- [Update Profile]


## Technologies Used

- **Language**: Typescript
- **Headless Browser**: Playwright
- **Captcha Solver**: 2Captcha
- **Logger**: Graylog

## Installation

- Ensure you have Node.js installed on your system.
- Clone or download the bot repository.
- Run the following command to install necessary dependencies:

```bash
$ npm install
```
## Build

```bash
$ npm run build
```

## Run

```bash
$ node dist/main <platform> <alias> --debug --force
```
Parameters:
- platform: This parameter represents the model's platform(fansly, f2f, fancentro).
- alias: This parameter represents the model's alias.
- --debug: Disable headless browser options, so you can debug the bot automation.
- --force: Enable to run disabled bot.
