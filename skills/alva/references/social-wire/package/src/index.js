"use strict";

const {
  SocialWire,
  defaultPostScore,
  defaultTickerExtractor,
  normalizePost,
  normalizeTicker,
  unique,
} = require("./social-wire");
const { createArraysXByHandleAdapter } = require("./arrays-x-adapter");

module.exports = {
  SocialWire,
  createArraysXByHandleAdapter,
  defaultPostScore,
  defaultTickerExtractor,
  normalizePost,
  normalizeTicker,
  unique,
};
