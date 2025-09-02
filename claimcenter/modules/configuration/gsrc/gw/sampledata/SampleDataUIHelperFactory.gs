package gw.sampledata

uses gw.lang.reflect.ReflectUtil
uses gw.lang.reflect.TypeSystem

/**
 * SampleDataUIHelperFactory used to return instances of the SampleDataUIHelper classes.
 * New UI helper classes should not be instantiated separately in the code.
 */
@Export
class SampleDataUIHelperFactory {

  private static final var UI_HELPER_IMPLEMENTATION : String = "gw.sampledata.ComposableSampleDataUIHelper"

  private static var _instance : SampleDataUIHelperFactory

  public static property get Instance() : SampleDataUIHelperFactory {
    if (_instance == null) {
      _instance = new SampleDataUIHelperFactory()
    }
    return _instance
  }

  /**
   * Returns an instance of the {@link SampleDataUIHelper}.
   */
  @Returns("An instance of the SampleDataUIHelper")
  public property get SampleDataUIHelper() : SampleDataUIHelper {
    return this.createHelper(UI_HELPER_IMPLEMENTATION) as SampleDataUIHelper
  }

  private function createHelper(helper : String) : Object {
    return ReflectUtil.construct(helper)
  }
}