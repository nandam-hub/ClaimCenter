package gw.rest.core.cc.testutil.v1.group

uses gw.api.database.IQueryBeanResult
uses gw.api.modules.rest.framework.v1.json.DataAttributes
uses gw.api.modules.rest.framework.v1.resources.ResourceName
uses gw.api.modules.rest.framework.v1.resources.RootKeyableBeanRestQueryCollectionResource
uses gw.api.modules.rest.framework.v1.resources.TestOnlyResource

@TestOnlyResource
@ResourceName("TestUtilGroups")
@Export
class TestUtilGroupsCoreResource extends RootKeyableBeanRestQueryCollectionResource {

  protected override function buildBaseQuery() : IQueryBeanResult<KeyableBean> {
    throw new UnsupportedOperationException("Getting the Groups collection is not supported from the test-util context")
  }

  override function createMinimalChildElement(attributes : DataAttributes) : Object {
    return new Group(this.Bundle)
  }

  override property get CollectionId() : String {
    return "/groups"
  }

  override property get ParentUrl() : String {
    return getApiBasePath("test-util")
  }

  override property get SelfUrl() : String {
    return null
  }

  protected override property get ChildType() : Class<TestUtilGroupCoreResource> {
    return TestUtilGroupCoreResource
  }
}