package gw.rest.core.cc.testutil.v1.policy

uses gw.api.modules.rest.framework.v1.batch.BatchUpdateMap
uses gw.api.modules.rest.framework.v1.json.DataEnvelope
uses gw.api.modules.rest.framework.v1.resources.ResourceName
uses gw.api.modules.rest.framework.v1.resources.TestOnlyResource
uses gw.api.modules.rest.framework.v1.resources.VersionableRestElementResource

@TestOnlyResource
@ResourceName("TestUtilPolicy")
@Export
class TestUtilPolicyCoreResource extends VersionableRestElementResource<TestUtilPoliciesCoreResource, Policy> {

  /**
   * The resource exists for test-util purposes only. It is not fully implemented, therefore there is no selfUrl
   */
  override property get SelfUrl() : String {
    return null
  }

  property get Policy() : Policy {
    return Element
  }

  override function finishCreate(data : DataEnvelope, batchUpdateMap : BatchUpdateMap) {
    Policy.TotalVehicles = Policy.Vehicles*.Vehicle.Count
    Policy.TotalProperties = Policy.Properties*.Property.Count
  }

  protected override property get BeanType() : Class<Policy> {
    return entity.Policy
  }
}