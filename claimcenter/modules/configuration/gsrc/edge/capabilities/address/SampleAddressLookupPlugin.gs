package edge.capabilities.address

uses edge.PlatformSupport.TranslateUtil
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.dto.AddressLookupResultDTO
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.address.dto.AddressLookupResultsDTO
uses edge.capabilities.address.dto.AddressLookupDTO

/**
 * This sample address lookup plugin uses sample data to return sample results for some pre-defined
 * queries. It should be used as a reference for creating a plugin that interfaces to a real address
 * lookup service.
 */
class SampleAddressLookupPlugin implements IAddressLookupPlugin {

  private var _addressCompletion: IAddressCompletionPlugin

  final var _usAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.8,
        :Address = new AddressDTO() {
          :AddressLine1 = "3620 Lyon St",
          :City = "San Francisco",
          :State = State.TC_CA,
          :PostalCode = "94123",
          :Country = Country.TC_US
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.7,
        :Address = new AddressDTO() {
          :AddressLine1 = "3626 Lyon St",
          :City = "San Francisco",
          :State = State.TC_CA,
          :PostalCode = "94123",
          :Country = Country.TC_US
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.6,
        :Address = new AddressDTO() {
          :AddressLine1 = "3632 Lyon St",
          :City = "San Francisco",
          :State = State.TC_CA,
          :PostalCode = "94123",
          :Country = Country.TC_US
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.5,
        :Address = new AddressDTO() {
          :AddressLine1 = "1001 E Hillsdale Blvd #800",
          :City = "Foster City",
          :State = State.TC_CA,
          :PostalCode = "94404",
          :Country = Country.TC_US
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.4,
        :Address = new AddressDTO() {
          :AddressLine1 = "1001 E Hillsdale Blvd #800-1",
          :City = "Foster City",
          :State = State.TC_CA,
          :PostalCode = "94404",
          :Country = Country.TC_US
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.3,
        :Address = new AddressDTO() {
          :AddressLine1 = "1001 E Hillsdale Blvd #800-2",
          :City = "Foster City",
          :State = State.TC_CA,
          :PostalCode = "94404",
          :Country = Country.TC_US
        }
      }
  }

  final var _inUsAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.9,
        :Address = new AddressDTO() {
          :AddressLine1 = "100 Great Oaks Blvd # 100",
          :City = "San Jose",
          :State = State.TC_CA,
          :PostalCode = "95119",
          :Country = Country.TC_US
        }
      }
  }

  final var _emeaAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.6,
        :Address = new AddressDTO() {
          :AddressLine1 = "Pellipar House",
          :AddressLine2 = "9 Cloak Ln",
          :City = "London",
          :PostalCode = "EC4R 2RU",
          :Country = Country.TC_GB
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.55,
        :Address = new AddressDTO() {
          :AddressLine1 = "Pellipar House",
          :AddressLine2 = "9a Cloak Ln",
          :City = "London",
          :PostalCode = "EC4R 2RU",
          :Country = Country.TC_GB
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.52,
        :Address = new AddressDTO() {
          :AddressLine1 = "Pellipar House",
          :AddressLine2 = "9b Cloak Ln",
          :City = "London",
          :PostalCode = "EC4R 2RU",
          :Country = Country.TC_GB
        }
      }
  }

  final var _apacAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.9,
        :Address = new AddressDTO() {
          :AddressLine1 = "Level 2",
          :AddressLine2 = "95 Pitt Street",
          :City = "Sydney",
          :PostalCode = "NSW 2000",
          :Country = Country.TC_AU
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.8,
        :Address = new AddressDTO() {
          :AddressLine1 = "Level 2a",
          :AddressLine2 = "95 Pitt Street",
          :City = "Sydney",
          :PostalCode = "NSW 2000",
          :Country = Country.TC_AU
        }
      },
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.7,
        :Address = new AddressDTO() {
          :AddressLine1 = "Level 2b",
          :AddressLine2 = "95 Pitt Street",
          :City = "Sydney",
          :PostalCode = "NSW 2000",
          :Country = Country.TC_AU
        }
      }
  }

  final var _canadianAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.8,
        :Address = new AddressDTO() {
          :AddressLine1 = "5600 Explorer Drive",
          :AddressLine2 = "Suite 202",
          :City = "Mississauga",
          :PostalCode = "L4W 4Y2",
          :Country = Country.TC_CA
        }
      }
  }

  final var _japaneseAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.8,
        :Address = new AddressDTO() {
          :AddressLine1 = "19th Floor Kabukiza Tower",
          :AddressLine2 = "4-12-15 Ginza, Chuo-ku",
          :City = "Tokyo",
          :PostalCode = "104-0061",
          :State = State.TC_TOKYO,
          :Country = Country.TC_JP
        }
      }
  }

  final var _germanAddressResults = new AddressLookupResultDTO[]{
      new AddressLookupResultDTO() {
        :MatchAccuracy = 0.8,
        :Address = new AddressDTO() {
          :AddressLine1 = "Zeppelinstraße 71-73",
          :City = "München",
          :PostalCode = "81669",
          :Country = Country.TC_DE
        }
      }
  }

  @ForAllGwNodes
  @Param("addressCompletion", "Plugin used for postal code completion")
  construct(addressCompletion: IAddressCompletionPlugin) {
    this._addressCompletion = addressCompletion
  }

  override function lookupAddressUsingString(partialAddress: String): AddressLookupResultsDTO {

    if (partialAddress.trim().length() == 0) {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{},
        :ErrorCode = "1",
        :ErrorDescription = "No search term provided"
      }
    }

    switch (partialAddress.toLowerCase()) {
      case "1001 e hillsdale":
      case "94404":
        return new AddressLookupResultsDTO() {
          :Matches = _usAddressResults
        }
      case "1001 e hillsdale blvd #800, foster city, ca 94404":
        return new AddressLookupResultsDTO() {
          :Matches = new AddressLookupResultDTO[]{_usAddressResults.first()}
        }
      case "pellipar house":
      case "ec4r 2ru":
        return new AddressLookupResultsDTO() {
          :Matches = _emeaAddressResults
        }
      case "pellipar house, 9 cloak ln, london ec4r 2ru":
        return new AddressLookupResultsDTO() {
          :Matches = new AddressLookupResultDTO[]{_emeaAddressResults.first()}
        }
      case "95 pitt street":
      case "nsw 2000":
        return new AddressLookupResultsDTO() {
          :Matches = _apacAddressResults
        }
      case "level 2, 95 pitt street, sydney, nsw 2000":
        return new AddressLookupResultsDTO() {
          :Matches = new AddressLookupResultDTO[]{_apacAddressResults.first()}
        }
      case "error":
        return new AddressLookupResultsDTO() {
          :Matches = new AddressLookupResultDTO[]{},
          :ErrorCode = "999",
          :ErrorDescription = "Test error"
        }
      default:


        var allData = _usAddressResults.concat(_emeaAddressResults)
            .concat(_apacAddressResults).concat(_canadianAddressResults)
            .concat(_japaneseAddressResults).concat(_germanAddressResults)

        var searchResults = allData.where(\elt -> {
          return (elt.Address.AddressLine1.containsIgnoreCase(partialAddress)
              || (elt.Address.AddressLine2 != null && elt.Address.AddressLine2.containsIgnoreCase(partialAddress))
              || elt.Address.City.containsIgnoreCase(partialAddress)
              || elt.Address.PostalCode.containsIgnoreCase(partialAddress))
        })

        if (searchResults.length > 0) {
          return new AddressLookupResultsDTO() {
            :Matches = searchResults
          }
        } else {
          return new AddressLookupResultsDTO() {
            :Matches = new AddressLookupResultDTO[]{},
            :ErrorCode = "0",
            :ErrorDescription = TranslateUtil.translate('Edge.Capabilities.Address.SampleAddressLookupPlugin.NoMatchingAddressesFound')
          }
        }
    }
  }

  override function lookupAddressUsingStringAndFilterByPostalCode(partialAddress: String, postalCode: String): AddressLookupResultsDTO {
    var addressesFoundUsingStringLookup = lookupAddressUsingString(partialAddress)
    var addressesFilteredByPostalCode = addressesFoundUsingStringLookup.Matches.where(\addressMatch -> (addressMatch.Address.PostalCode == postalCode))
    if (addressesFilteredByPostalCode.length == 0) {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{},
        :ErrorCode = "0",
        :ErrorDescription = TranslateUtil.translate('Edge.Capabilities.Address.SampleAddressLookupPlugin.NoMatchingAddressesFound')
      }
    } else {
      return new AddressLookupResultsDTO() {
        :Matches = addressesFilteredByPostalCode
      }
    }
  }

  override function lookupAddressUsingObject(partialAddress: AddressLookupDTO): AddressLookupResultsDTO {

    if (partialAddress.AddressLine1 == "1001 E Hillsdale Blvd #800" &&
        partialAddress.City == "Foster City" &&
        partialAddress.State == State.TC_CA &&
        partialAddress.PostalCode == "94404") {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{_usAddressResults.first()}
      }
    } else if (partialAddress.PostalCode == "95119") {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{_inUsAddressResults.first()}
      }
    } else if (
        partialAddress.AddressLine1 == "1001 E Hillsdale" ||
            partialAddress.PostalCode == "94404") {
      return new AddressLookupResultsDTO() {
        :Matches = _usAddressResults
      }
    }

    if (partialAddress.AddressLine1 == "Pellipar House" &&
        partialAddress.AddressLine2 == "9 Cloak Ln" &&
        partialAddress.City == "London" &&
        partialAddress.PostalCode == "EC4R 2RU") {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{_emeaAddressResults.first()}
      }
    } else if (
        partialAddress.AddressLine1 == "Pellipar House" ||
            partialAddress.PostalCode == "EC4R 2RU") {
      return new AddressLookupResultsDTO() {
        :Matches = _emeaAddressResults
      }
    }

    if (partialAddress.PostalCode == "95119") {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{_apacAddressResults.first()}
      }
    }

    if (partialAddress.AddressLine1 == "Level 2" &&
        partialAddress.AddressLine2 == "95 Pitt Street" &&
        partialAddress.City == "Sydney" &&
        partialAddress.PostalCode == "NSW 2000") {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{_apacAddressResults.first()}
      }
    } else if (
        partialAddress.AddressLine1 == "Level 2" ||
            partialAddress.PostalCode == "NSW 2000") {
      return new AddressLookupResultsDTO() {
        :Matches = _apacAddressResults
      }
    }

    return new AddressLookupResultsDTO() {
      :Matches = new AddressLookupResultDTO[]{},
      :ErrorCode = "0",
      :ErrorDescription = TranslateUtil.translate('Edge.Capabilities.Address.SampleAddressLookupPlugin.NoMatchingAddressesFound')
    }
  }

  override function lookupAddressUsingPostalCode(postalCode: String): AddressLookupResultsDTO {
    if (postalCode != null) {
      return new AddressLookupResultsDTO() {
        :Matches = new AddressLookupResultDTO[]{
            new AddressLookupResultDTO() {
              :MatchAccuracy = 0.5,
              :Address = _addressCompletion.getAddressFromZipCode(postalCode)
            }
        },
        :ErrorCode = "0",
        :ErrorDescription = TranslateUtil.translate('Edge.Capabilities.Address.SampleAddressLookupPlugin.NoMatchingAddressesFound')
      }
    }

    return new AddressLookupResultsDTO() {
      :Matches = new AddressLookupResultDTO[]{},
      :ErrorCode = "0",
      :ErrorDescription = TranslateUtil.translate('Edge.Capabilities.Address.SampleAddressLookupPlugin.NoMatchingAddressesFound')
    }
  }
}
