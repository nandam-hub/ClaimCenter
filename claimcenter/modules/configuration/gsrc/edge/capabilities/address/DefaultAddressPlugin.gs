package edge.capabilities.address

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.dto.AddressDTO
uses gw.api.address.AddressFillableExtension

/** Default implementation of address plugin. */
class DefaultAddressPlugin implements IAddressPlugin {

  @ForAllGwNodes
  construct() {

  }

  override function toDto(address : Address) : AddressDTO {
    if (address == null) {
      return null
    }
    final var res = new AddressDTO()
    fillAddress(res, address)
    return res
  }

  override function doAddressesDiffer(addr1 : AddressDTO, addr2 : AddressDTO) : Boolean {
    return doBaseAddressesDiffer(addr1, addr2)
  }
  
  public static function fillAddress(res : AddressDTO, address : Address) {
    res.PublicID = address.PublicID
    res.DisplayName = address.DisplayName
    res.AddressLine1 = address.AddressLine1
    res.AddressLine1Kanji = address.AddressLine1Kanji
    res.AddressLine2 = address.AddressLine2
    res.AddressLine2Kanji = address.AddressLine2Kanji
    res.AddressLine3 = address.AddressLine3
    res.City = address.City
    res.CityKanji = address.CityKanji
    res.State = address.State
    res.PostalCode = address.PostalCode
    res.Country = address.Country
    res.AddressType = address.AddressType
    res.County = address.County
  }

  public static function fillAddress(res : AddressDTO, address : AddressFillableExtension) {
    res.AddressLine1 = address.AddressLine1
    res.AddressLine1Kanji = address.AddressLine1Kanji
    res.AddressLine2 = address.AddressLine2
    res.AddressLine2Kanji = address.AddressLine2Kanji
    res.AddressLine3 = address.AddressLine3
    res.City = address.City
    res.CityKanji = address.CityKanji
    res.State = address.State
    res.PostalCode = address.PostalCode
    res.Country = address.Country
    res.County = address.County
  }

  override function updateFromDTO(address : Address, dto : AddressDTO) {
    address.AddressLine1 = dto.AddressLine1
    address.AddressLine1Kanji = dto.AddressLine1Kanji
    address.AddressLine2 = dto.AddressLine2
    address.AddressLine2Kanji = dto.AddressLine2Kanji
    address.AddressLine3 = dto.AddressLine3
    address.City = dto.City
    address.CityKanji = dto.CityKanji
    address.State = dto.State
    address.PostalCode = dto.PostalCode
    address.Country = dto.Country
    address.AddressType = dto.AddressType
    address.County = dto.County
  }

  /** Customers can use this to compare base fields on the address. */
  public static function doBaseAddressesDiffer(addr1 : AddressDTO, addr2 : AddressDTO) : Boolean {
    if(addr1.AddressLine1 != addr2.AddressLine1){
      return true
    }
    if(!similarStrings(addr1.AddressLine2, addr2.AddressLine2)) {
      return true
    }
    if(!similarStrings(addr1.AddressLine3, addr2.AddressLine3)) {
      return true
    }
    if(addr1.City != addr2.City){
      return true
    }
    if(addr1.State != addr2.State){
      return true
    }
    if (addr1.PostalCode != addr2.PostalCode) {
      return true
    }
    return false
  }
  
  
  /**
   * Compares strings treating both null and empty values as equal.
   */
  public static function similarStrings(s1 : String, s2 : String) : Boolean {
    return nvl(s1) == nvl(s2)   
  }

  private static function nvl(s: String): String {
    return s == null ? "" : s
  }
}
