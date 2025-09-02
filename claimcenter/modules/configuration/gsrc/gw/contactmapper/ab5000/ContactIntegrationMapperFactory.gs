package gw.contactmapper.ab5000

/**
 * Returns the ContactIntegrationMapper to be used by ClaimCenter
 * for integration.  It's @Export so customers can make the mapper() method return
 * a different ContactIntegrationMapper.
 */
@Export
class ContactIntegrationMapperFactory {

  public static function mapper() : ContactIntegrationMapper {
    return new gw.contactmapper.ab5000.ContactMapper()
  }
}
