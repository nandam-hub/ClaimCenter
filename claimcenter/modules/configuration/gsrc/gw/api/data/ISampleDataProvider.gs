package gw.api.data

interface ISampleDataProvider {
  property get CollectionName(): String
  property get AlreadyLoaded(): boolean
  function load()
}