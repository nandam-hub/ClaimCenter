package gw.api.data

uses gw.api.system.PLLoggerCategory

class PortalsProvider implements ISampleDataProvider {
  var _portalsDataProviders : ISampleDataProvider[]

  property get PortalsDataProviders(): ISampleDataProvider[] {
    if (_portalsDataProviders == null) {
      _portalsDataProviders = {
          new RoleProvider(),
          new UserProvider(),
          new ClaimProvider()
      }
    }
    return _portalsDataProviders
  }

  override property get CollectionName() : String {
    return "Portals Sample Data"
  }

  override property get AlreadyLoaded() : boolean {
    return PortalsDataProviders.allMatch(\dataProvider -> dataProvider.AlreadyLoaded)
  }

  override function load() {
    PortalsDataProviders.each(\dataProvider -> {
      if (dataProvider.AlreadyLoaded) {
        PLLoggerCategory.DATAGEN.info(" - already loaded " + dataProvider.CollectionName)
      } else {
        PLLoggerCategory.DATAGEN.info(" - loading " + dataProvider.CollectionName + "...")
        dataProvider.load()
      }
    })
  }
}