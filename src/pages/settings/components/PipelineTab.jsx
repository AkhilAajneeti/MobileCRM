import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';


const PipelineTab = () => {
  const [pipelineStages, setPipelineStages] = useState([
    {
      id: 1,
      name: "New",
      probability: 10,
      color: "#94A3B8",
      order: 1,
      active: true,
      isDefault: true
    },
    {
      id: 2,
      name: "Qualified",
      probability: 25,
      color: "#3B82F6",
      order: 2,
      active: true,
      isDefault: false
    },
    {
      id: 3,
      name: "Proposal",
      probability: 60,
      color: "#8B5CF6",
      order: 3,
      active: true,
      isDefault: false
    },
    {
      id: 4,
      name: "Negotiation",
      probability: 80,
      color: "#F59E0B",
      order: 4,
      active: true,
      isDefault: false
    },
    {
      id: 5,
      name: "Won",
      probability: 100,
      color: "#10B981",
      order: 5,
      active: true,
      isDefault: true
    },
    {
      id: 6,
      name: "Lost",
      probability: 0,
      color: "#EF4444",
      order: 6,
      active: true,
      isDefault: true
    }
  ]);

  const [automationRules, setAutomationRules] = useState([
    {
      id: 1,
      name: "Auto-assign new deals",
      trigger: "Deal created",
      action: "Assign to round-robin",
      active: true
    },
    {
      id: 2,
      name: "Notify on stage change",
      trigger: "Stage updated",
      action: "Send email notification",
      active: true
    },
    {
      id: 3,
      name: "Update close date",
      trigger: "Moved to Proposal",
      action: "Set close date +30 days",
      active: false
    }
  ]);

  const [newStage, setNewStage] = useState({
    name: "",
    probability: 50,
    color: "#8B5CF6"
  });

  const [newRule, setNewRule] = useState({
    name: "",
    trigger: "Deal created",
    action: "Assign to round-robin"
  });

  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const colorOptions = [
    { value: "#94A3B8", label: "Gray" },
    { value: "#3B82F6", label: "Blue" },
    { value: "#8B5CF6", label: "Purple" },
    { value: "#10B981", label: "Green" },
    { value: "#F59E0B", label: "Yellow" },
    { value: "#EF4444", label: "Red" },
    { value: "#EC4899", label: "Pink" },
    { value: "#06B6D4", label: "Cyan" }
  ];

  const triggerOptions = [
    { value: "Deal created", label: "Deal Created" },
    { value: "Stage updated", label: "Stage Updated" },
    { value: "Amount changed", label: "Amount Changed" },
    { value: "Close date passed", label: "Close Date Passed" },
    { value: "Moved to Proposal", label: "Moved to Proposal" },
    { value: "Moved to Won", label: "Moved to Won" },
    { value: "Moved to Lost", label: "Moved to Lost" }
  ];

  const actionOptions = [
    { value: "Assign to round-robin", label: "Assign to Round-Robin" },
    { value: "Send email notification", label: "Send Email Notification" },
    { value: "Create follow-up task", label: "Create Follow-up Task" },
    { value: "Set close date +30 days", label: "Set Close Date +30 Days" },
    { value: "Update deal priority", label: "Update Deal Priority" },
    { value: "Send Slack notification", label: "Send Slack Notification" }
  ];

  const handleNewStageChange = (field, value) => {
    setNewStage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewRuleChange = (field, value) => {
    setNewRule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateStage = async () => {
    setIsLoading(true);
    // Mock stage creation
    setTimeout(() => {
      const stage = {
        id: pipelineStages?.length + 1,
        name: newStage?.name,
        probability: newStage?.probability,
        color: newStage?.color,
        order: pipelineStages?.length + 1,
        active: true,
        isDefault: false
      };
      
      setPipelineStages(prev => [...prev, stage]);
      setNewStage({ name: "", probability: 50, color: "#8B5CF6" });
      setIsAddStageModalOpen(false);
      setIsLoading(false);
      console.log('Pipeline stage created successfully');
    }, 1000);
  };

  const handleCreateRule = async () => {
    setIsLoading(true);
    // Mock rule creation
    setTimeout(() => {
      const rule = {
        id: automationRules?.length + 1,
        name: newRule?.name,
        trigger: newRule?.trigger,
        action: newRule?.action,
        active: true
      };
      
      setAutomationRules(prev => [...prev, rule]);
      setNewRule({ name: "", trigger: "Deal created", action: "Assign to round-robin" });
      setIsAddRuleModalOpen(false);
      setIsLoading(false);
      console.log('Automation rule created successfully');
    }, 1000);
  };

  const handleToggleStage = (stageId) => {
    setPipelineStages(prev => prev?.map(stage => 
      stage?.id === stageId ? { ...stage, active: !stage?.active } : stage
    ));
  };

  const handleToggleRule = (ruleId) => {
    setAutomationRules(prev => prev?.map(rule => 
      rule?.id === ruleId ? { ...rule, active: !rule?.active } : rule
    ));
  };

  const handleDeleteStage = (stageId) => {
    const stage = pipelineStages?.find(s => s?.id === stageId);
    if (stage?.isDefault) {
      console.log('Cannot delete default stage');
      return;
    }
    setPipelineStages(prev => prev?.filter(stage => stage?.id !== stageId));
  };

  const handleDeleteRule = (ruleId) => {
    setAutomationRules(prev => prev?.filter(rule => rule?.id !== ruleId));
  };

  const moveStage = (stageId, direction) => {
    const stageIndex = pipelineStages?.findIndex(s => s?.id === stageId);
    if (
      (direction === 'up' && stageIndex === 0) ||
      (direction === 'down' && stageIndex === pipelineStages?.length - 1)
    ) {
      return;
    }

    const newStages = [...pipelineStages];
    const targetIndex = direction === 'up' ? stageIndex - 1 : stageIndex + 1;
    
    [newStages[stageIndex], newStages[targetIndex]] = [newStages?.[targetIndex], newStages?.[stageIndex]];
    
    setPipelineStages(newStages);
  };

  return (
    <div className="space-y-8">
      {/* Pipeline Stages */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Icon name="GitBranch" size={24} className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Pipeline Stages</h3>
              <p className="text-sm text-muted-foreground">Configure your sales pipeline stages and probabilities</p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => setIsAddStageModalOpen(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Add Stage
          </Button>
        </div>

        {/* Pipeline Visualization */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-card-foreground mb-4">Pipeline Preview</h4>
          <div className="flex items-center space-x-2 overflow-x-auto">
            {pipelineStages?.filter(stage => stage?.active)?.sort((a, b) => a?.order - b?.order)?.map((stage, index, activeStages) => (
                <React.Fragment key={stage?.id}>
                  <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: stage?.color }}
                    >
                      {stage?.probability}%
                    </div>
                    <span className="text-xs text-center mt-2 font-medium">{stage?.name}</span>
                  </div>
                  {index < activeStages?.length - 1 && (
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
          </div>
        </div>

        {/* Stages List */}
        <div className="space-y-3">
          {pipelineStages?.map((stage) => (
            <div key={stage?.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => moveStage(stage?.id, 'up')}
                    className="p-1 hover:bg-muted rounded transition-smooth"
                    disabled={pipelineStages?.findIndex(s => s?.id === stage?.id) === 0}
                    aria-label="Move stage up"
                  >
                    <Icon name="ChevronUp" size={14} />
                  </button>
                  <button
                    onClick={() => moveStage(stage?.id, 'down')}
                    className="p-1 hover:bg-muted rounded transition-smooth"
                    disabled={pipelineStages?.findIndex(s => s?.id === stage?.id) === pipelineStages?.length - 1}
                    aria-label="Move stage down"
                  >
                    <Icon name="ChevronDown" size={14} />
                  </button>
                </div>

                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage?.color }}
                />

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-card-foreground">{stage?.name}</span>
                    {stage?.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{stage?.probability}% probability</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStage(stage?.id)}
                  className={stage?.active ? 'text-success' : 'text-muted-foreground'}
                >
                  <Icon name={stage?.active ? "Eye" : "EyeOff"} size={16} className="mr-2" />
                  {stage?.active ? 'Active' : 'Inactive'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => console.log('Edit stage', stage?.id)}
                  aria-label="Edit stage"
                >
                  <Icon name="Edit" size={16} />
                </Button>
                {!stage?.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteStage(stage?.id)}
                    aria-label="Delete stage"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Automation Rules */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Icon name="Zap" size={24} className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Automation Rules</h3>
              <p className="text-sm text-muted-foreground">Set up automated actions for your pipeline</p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => setIsAddRuleModalOpen(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Add Rule
          </Button>
        </div>

        <div className="space-y-3">
          {automationRules?.map((rule) => (
            <div key={rule?.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-card-foreground">{rule?.name}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    rule?.active 
                      ? 'bg-success/10 text-success' :'bg-muted text-muted-foreground'
                  }`}>
                    {rule?.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  When <span className="font-medium">{rule?.trigger}</span> → <span className="font-medium">{rule?.action}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleRule(rule?.id)}
                  className={rule?.active ? 'text-success' : 'text-muted-foreground'}
                >
                  <Icon name={rule?.active ? "ToggleRight" : "ToggleLeft"} size={16} className="mr-2" />
                  {rule?.active ? 'On' : 'Off'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => console.log('Edit rule', rule?.id)}
                  aria-label="Edit rule"
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRule(rule?.id)}
                  aria-label="Delete rule"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Add Stage Modal */}
      {isAddStageModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddStageModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">Add Pipeline Stage</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddStageModalOpen(false)}
                  aria-label="Close modal"
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Stage Name"
                  type="text"
                  value={newStage?.name}
                  onChange={(e) => handleNewStageChange('name', e?.target?.value)}
                  placeholder="e.g., Discovery, Demo"
                  required
                />
                
                <Input
                  label="Win Probability (%)"
                  type="number"
                  value={newStage?.probability}
                  onChange={(e) => handleNewStageChange('probability', parseInt(e?.target?.value) || 0)}
                  min="0"
                  max="100"
                  required
                />

                <Select
                  label="Stage Color"
                  options={colorOptions}
                  value={newStage?.color}
                  onChange={(value) => handleNewStageChange('color', value)}
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddStageModalOpen(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleCreateStage}
                    loading={isLoading}
                    iconName="Save"
                    iconPosition="left"
                    fullWidth
                    disabled={!newStage?.name?.trim()}
                  >
                    Create Stage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Add Rule Modal */}
      {isAddRuleModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddRuleModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">Add Automation Rule</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  aria-label="Close modal"
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Rule Name"
                  type="text"
                  value={newRule?.name}
                  onChange={(e) => handleNewRuleChange('name', e?.target?.value)}
                  placeholder="e.g., Auto-assign high-value deals"
                  required
                />
                
                <Select
                  label="Trigger Event"
                  options={triggerOptions}
                  value={newRule?.trigger}
                  onChange={(value) => handleNewRuleChange('trigger', value)}
                />

                <Select
                  label="Action"
                  options={actionOptions}
                  value={newRule?.action}
                  onChange={(value) => handleNewRuleChange('action', value)}
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddRuleModalOpen(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleCreateRule}
                    loading={isLoading}
                    iconName="Save"
                    iconPosition="left"
                    fullWidth
                    disabled={!newRule?.name?.trim()}
                  >
                    Create Rule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PipelineTab;