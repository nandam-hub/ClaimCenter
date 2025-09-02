package gw.entity
uses gw.api.address.ExposureAddressOwner
uses gw.api.address.CCAddressOwner

@Export
enhancement GWExposureEnhancement : Exposure
{
   property get AddressOwner() : CCAddressOwner { 
    return new ExposureAddressOwner(this)
  }

  property get PolicyLocation() : PolicyLocation {
    var prop = entity.FixedPropertyIncident.Type.TypeInfo.getProperty("Property") as gw.entity.IEntityPropertyInfo
    return gw.api.address.CCAddressOwnerUtil.getOrCreateNewBeanFor(this.FixedPropertyIncident, prop, \ -> new PolicyLocation())
  }
}
