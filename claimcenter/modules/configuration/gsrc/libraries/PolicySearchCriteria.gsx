package libraries

uses java.lang.Exception

@Export
enhancement PolicySearchCriteria : entity.PolicySearchCriteria
{
  /**this method resets the fields on PolicySearchCriteria, add/remove fields for customization
    */
  function resetPolicySearchCriteria()
  {
    this.PolicyNumber = null
    this.FirstName = null
    this.LastName = null
    this.CompanyName = null
    this.PolicyType = User.util.getCurrentUser().PolicyType
    this.LossDate = null
    this.TaxIdString = null
    //this.City = null;
    this.InsuredAddress.City = null
    this.InsuredAddress.State = null
    this.InsuredAddress.PostalCode = null
    this.InsuredAddress.Country = null
    this.Vin = null
    this.ProducerCode = null
    this.AccountNumber = null
    try {
      this.setFieldValue( "IncludeArchived", Boolean.FALSE )
      print("set value")
    } catch (e:Exception) {
      //Nop on purpose, this field does not exist on bedrock,  but needs to be reset on Diamond
    }
  }

}
