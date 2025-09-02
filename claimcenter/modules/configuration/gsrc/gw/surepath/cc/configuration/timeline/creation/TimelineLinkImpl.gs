package gw.surepath.cc.configuration.timeline.creation

uses gw.entity.IEntityType
uses gw.lang.reflect.TypeSystem
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Referenced by TimelineLink_SP
 */
@IncludeInDocumentation
class TimelineLinkImpl implements TimelineLinkInterface {

  var _link : TimelineLink_SP = null
  var _bean : KeyableBean = null

  construct(link : TimelineLink_SP) {
    _link = link
  }

  public property set Bean(b : KeyableBean) {
    _bean = b
  }

  public function load() : KeyableBean {

    if (_bean == null) {
      _bean = TimelineUtil.findByPublicId(TypeSystem.getByFullName(_link.BeanType) as IEntityType,
          _link.BeanID) as KeyableBean
    }
    return _bean
  }

  public function setConnection() : void {
    _link.BeanID = _bean.PublicID
    _link.BeanType = _bean.getIntrinsicType().toString()
  }
}
