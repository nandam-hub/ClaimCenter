package gw.sampledata

uses gw.api.locale.DisplayKey

@Export
class ComposableSampleDataUIHelper implements SampleDataUIHelper {

  private var _allDataSets : Collection<LoadableSampleDataSet>
  private var _allVisibleDataSets : Collection<LoadableSampleDataSet>
  private var _groups : Set<String>

  construct() {
    this(ComposableSampleData.getLoadableSampleDataSets(null, true).sortBy(\a -> a.SampleDataSource.Priority))
  }

  construct(allDataSets : Collection<LoadableSampleDataSet>) {
    loadDatasets(allDataSets)
    loadGroups()
  }

  override function loadSampleDataSet(identifier : String) : String {
    ComposableSampleData.loadSampleData(identifier)
    var loadedDependencies = calculateDependenciesTree(identifier)
    var loadedDependenciesAsString = new StringBuilder(DisplayKey.get("Web.InternalTools.SampleData.Loaded.Dependencies"))

    for (dep in loadedDependencies) {
      if (not loadedDependenciesAsString.isEmpty()) {
        loadedDependenciesAsString.append("\n")
      }

      loadedDependenciesAsString.append(dep)
    }

    return loadedDependenciesAsString.toString()
  }

  override function getGroups() : List<String> {
    return _groups.toList()
  }

  override function getSubGroups(group : String) : List<String> {
    var subGroups = new ArrayList<String>()

    for (dataSet in _allVisibleDataSets.where(\ds -> ds typeis ParentOnlyLoadableSampleDataSet and ds.SampleDataSource.GroupName == group)) {
      subGroups.add(dataSet.SampleDataSource.Identifier)
    }
    return subGroups.sort()
  }

  override function getDataSets(group : String = null, subgroup : String = null) : List<String> {
    var datasets : Collection<LoadableSampleDataSet>

    if (group == null) {
      datasets = _allVisibleDataSets.where(\ds ->  not ds.SampleDataSource.GroupName.NotBlank)
    } else {
      var groupDatasets = _allVisibleDataSets.where(\ds -> ds.SampleDataSource.GroupName == group)
      if (subgroup == null) {
        datasets = groupDatasets
      } else {
        datasets = groupDatasets.where(\ds -> {
          var parents : List<Object>
          try {
            parents = ds.SampleDataSource?.getArrayParam("subgroups")
          } catch (throwable) {
            parents = null
          }
          if (parents.HasElements) {
            return parents.contains(subgroup)
          }
          return false
        })
      }
    }

    var identifiers = new ArrayList<String>()
    for (dataset in datasets.where(\ds -> not(ds typeis ParentOnlyLoadableSampleDataSet)).orderBy(\ds -> ds.SampleDataSource.Priority)) {
      identifiers.add(dataset.SampleDataSource.Identifier)
    }
    return identifiers
  }

  override function getLabel(identifier : String) : String {
    var dataset = findFirstVisibleDatasetWithId(identifier)
    return dataset != null ? DisplayKey.get(dataset.SampleDataSource.DisplayKey) : String.EMPTY

  }

  override function getDescription(identifier : String) : String {
    var dataset = findFirstVisibleDatasetWithId(identifier)
    return dataset != null ? dataset.SampleDataSource?.Description : String.EMPTY
  }

  override function getPriority(identifier : String) : int {
    var dataset = findFirstVisibleDatasetWithId(identifier)
    return dataset != null ? dataset.SampleDataSource?.Priority : Integer.MAX_VALUE
  }

  override function getDataSetGroup(identifier : String) : String {
    return findFirstVisibleDatasetWithId(identifier)?.SampleDataSource?.GroupName
  }

  override function isDataSetLoaded(identifier : String) : boolean {
    return findFirstVisibleDatasetWithId(identifier).AlreadyLoaded;
  }

  override function isGroupRangeInputVisible() : boolean {
    return getGroups().HasElements
  }

  override function isSubGroupRangeInputVisible(group : String = null) : boolean {
    return group == null ? false : getSubGroups(group).HasElements
  }

  private function loadDatasets(allDataSets : Collection<LoadableSampleDataSet>) {
    _allDataSets = allDataSets
    _allVisibleDataSets = allDataSets.where(\ds ->  ds.SampleDataSource.Visible)
  }
  private function loadGroups() {
    _groups = new HashSet<String>()
    for (dataSet in _allVisibleDataSets.where(\ds -> ds.SampleDataSource.GroupName.NotBlank).sortBy(\ds -> ds.SampleDataSource.GroupName)) {
      var groupName = dataSet.SampleDataSource.GroupName
      if (not _allVisibleDataSets.hasMatch(\ds -> ds.SampleDataSource?.Identifier == groupName)) {
        _groups.add(groupName)
      }
    }
  }

  private function calculateDependenciesTree(identifier : String) : List<String> {
    var _dependencies = new HashSet<String>()
    var dataSet = findFirstDatasetWithId(identifier)
    if (dataSet != null) {
      for (dep in dataSet.SampleDataSource.Dependencies) {
        _dependencies.addAll(calculateDependenciesTree(dep))
      }
      _dependencies.add(identifier)
    }
    return _dependencies.toList()
  }

  private function findFirstVisibleDatasetWithId(identifier : String) : LoadableSampleDataSet {
    return _allVisibleDataSets.firstWhere(\ds -> ds.SampleDataSource.Identifier == identifier);
  }

  private function findFirstDatasetWithId(identifier : String) : LoadableSampleDataSet {
    return _allDataSets.firstWhere(\ds -> ds.SampleDataSource.Identifier == identifier);
  }

}