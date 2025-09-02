package edge.capabilities.address

uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocMethodDescription
uses edge.doc.ApidocAvailableSince
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses java.lang.IllegalArgumentException
uses edge.capabilities.address.dto.AddressLookupResultsDTO
uses edge.capabilities.address.dto.AddressLookupDTO

/**
 * Address Lookup handler.
 */
class AddressLookupHandler extends AbstractRpcHandler {

  var _addressLookupPlugin : IAddressLookupPlugin

  @InjectableNode
  construct(addressLookupPlugin:IAddressLookupPlugin) {
    _addressLookupPlugin = addressLookupPlugin
  }

  /**
   * Looks up possible addresses given a partial address as a string
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the partial address provided was null</dd>
   * </dl>
   *
   * @param partialAddress a partial address
   * @return results of the address lookup
   */
  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Attempts to find matching addresses using a partial string as search pattern and returns an array of zero or more AddressLookupResultDTO objects.")
  @ApidocAvailableSince("5.0")
  public function lookupAddressUsingString( partialAddress : String ) : AddressLookupResultsDTO {
    if (partialAddress == null){
      throw new IllegalArgumentException("Null Partial Address passed to AddressLookupHandler")
    }

    return _addressLookupPlugin.lookupAddressUsingString(partialAddress)
  }

  /**
   * Looks up possible addresses given a partial address as an AddressDTO
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the partial address provided was null</dd>
   * </dl>
   *
   * @param partialAddress a partial address
   * @return results of the address lookup
   */
  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Searches for address using a JSON AddressLookupDTO object and returns an array of zero or more AddressLookupResultDTO objects." +
      "NOTE: Note that you must use one or more of the following DTO fields when performing search: addressLine1; addressLine2, city, and postalCode.")
  @ApidocAvailableSince("5.0")
  public function lookupAddressUsingObject( partialAddress : AddressLookupDTO ) : AddressLookupResultsDTO {
    if (partialAddress == null){
      throw new IllegalArgumentException("Null Partial Address passed to AddressLookupHandler")
    }

    return _addressLookupPlugin.lookupAddressUsingObject(partialAddress)
  }

  /**
   * Filters out address that do not match the postal code provided and then
   * performs a search for the string input by the user
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the partial address or the postalCode provided was null</dd>
   * </dl>
   *
   * @param partialAddress a partial address
   * @param postalCode a postal code
   * @return results of the address lookup
   */
  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Attempts to find matching addresses using a partial string as search pattern, then filters by the postalCode provided and returns an array of zero or more AddressLookupResultDTO objects.")
  @ApidocAvailableSince("8.0")
  public function lookupAddressUsingStringAndFilterByPostalCode( partialAddress : String, postalCode: String ) : AddressLookupResultsDTO {
    if (partialAddress == null || postalCode == null){
      throw new IllegalArgumentException("partialAddress and postalCode are required to perform the address lookup")
    }

    return _addressLookupPlugin.lookupAddressUsingStringAndFilterByPostalCode(partialAddress, postalCode)
  }
}
