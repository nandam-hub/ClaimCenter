package edge.capabilities.claim.contact
uses edge.capabilities.claim.contact.dto.ContactDTO

/**
 * Helper class to accommodate Person entity differences between platforms.
 */
class ClaimContactPlatformHelper {
  static function fillPersonProperties(dto : ContactDTO, contact : Person) {
        dto.FirstNameKanji = contact.FirstNameKanji
        dto.LastNameKanji = contact.LastNameKanji
        dto.Particle = contact.Particle
  }

  static function updatePersonProperties(person : Person, dto : ContactDTO) {
      person.FirstNameKanji = dto.FirstNameKanji
      person.LastNameKanji = dto.LastNameKanji
      person.Particle = dto.Particle
  }
}
