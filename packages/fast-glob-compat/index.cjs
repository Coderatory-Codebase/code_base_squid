"use strict";

const { glob, globSync } = require("tinyglobby");

const normalizeOptions = ({ suppressErrors, ...options } = {}) => ({
  expandDirectories: false,
  ...options,
});

const normalizePaths = (paths) => paths.map((path) => path.replace(/\/$/, ""));

const runAsync = async (patterns, options = {}) => {
  try {
    return normalizePaths(await glob(patterns, normalizeOptions(options)));
  } catch (error) {
    if (options.suppressErrors) return [];
    throw error;
  }
};

const runSync = (patterns, options = {}) => {
  try {
    return normalizePaths(globSync(patterns, normalizeOptions(options)));
  } catch (error) {
    if (options.suppressErrors) return [];
    throw error;
  }
};

runAsync.glob = runAsync;
runAsync.async = runAsync;
runAsync.sync = runSync;
runAsync.globSync = runSync;

module.exports = runAsync;
