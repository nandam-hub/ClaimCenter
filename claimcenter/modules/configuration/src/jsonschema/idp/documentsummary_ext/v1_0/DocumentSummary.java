package jsonschema.idp.documentsummary_ext.v1_0;

import com.guidewire.pl.json.runtime.JsonWrapperList;
import gw.api.json.JsonDeserializationOptions;
import gw.api.json.JsonObject;
import gw.api.json.JsonParser;
import gw.api.json.JsonValidationResult;
import gw.api.json.JsonWrapper;
import gw.lang.SimplePropertyProcessing;

import javax.annotation.processing.Generated;
import java.util.List;

@SimplePropertyProcessing
@Generated(comments = "idp.documentsummary_ext-1.0#/definitions/DocumentSummary", value = "com.guidewire.pl.json.codegen.SchemaWrappersGenerator")
public class DocumentSummary extends JsonWrapper {

  private static final String FQN = "idp.documentsummary_ext-1.0#/definitions/DocumentSummary";

  public DocumentSummary() {
    super();
  }

  private DocumentSummary(JsonObject jsonObject) {
    super(jsonObject);
  }

  public static DocumentSummary wrap(JsonObject jsonObject) {
    return jsonObject == null ? null : new DocumentSummary(jsonObject);
  }

  public static String getFullyQualifiedName() {
    return FQN;
  }

  public static DocumentSummary parse(String json) {
    return json == null ? null : wrap(JsonParser.OBJECT.parse(json, FQN));
  }

  public static DocumentSummary parse(String json, JsonValidationResult jsonValidationResult, JsonDeserializationOptions jsonDeserializationOptions) {
    return json == null ? null : wrap(JsonParser.OBJECT.parse(json, FQN, jsonValidationResult, jsonDeserializationOptions));
  }

  public static List<DocumentSummary> parseArray(String json) {
    return json == null ? null : new JsonWrapperList<>(JsonParser.OBJECT.parseArray(json, FQN), DocumentSummary::wrap);
  }

  public static List<DocumentSummary> parseArray(String json, JsonValidationResult jsonValidationResult, JsonDeserializationOptions jsonDeserializationOptions) {
    return json == null ? null : new JsonWrapperList<>(JsonParser.OBJECT.parseArray(json, FQN, jsonValidationResult, jsonDeserializationOptions), DocumentSummary::wrap);
  }

  public String getDetailedSummary() {
    return getTyped("DetailedSummary");
  }

  public void setDetailedSummary(String value) {
    put("DetailedSummary", value);
  }

  public String getHighLevelSummary() {
    return getTyped("HighLevelSummary");
  }

  public void setHighLevelSummary(String value) {
    put("HighLevelSummary", value);
  }

}
