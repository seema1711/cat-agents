import { useEffect } from 'react';
import { OfficeState } from '../office/engine/officeState';

interface AgentInfo {
  id: number;
  sessionId: string;
  folderName: string;
  isWaiting?: boolean;
  activeTools?: Array<{ toolId: string; toolName: string; status: string }>;
  inputTokens?: number;
  outputTokens?: number;
}

type MessageHandler = (data: Record<string, unknown>) => void;

let agentColorCounter = 0;

export function useExtensionMessages(
  officeStateRef: React.MutableRefObject<OfficeState>,
  onRedraw: () => void,
): void {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as Record<string, unknown>;
      if (!msg || typeof msg.type !== 'string') return;
      handleMessage(msg, officeStateRef.current, onRedraw);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [officeStateRef, onRedraw]);
}

function handleMessage(
  msg: Record<string, unknown>,
  state: OfficeState,
  onRedraw: () => void,
): void {
  const type = msg.type as string;

  switch (type) {
    case 'existingAgents': {
      const agents = msg.agents as AgentInfo[];
      for (const a of agents) {
        if (!state.characters.has(a.id)) {
          state.addAgent(a.id, a.folderName, agentColorCounter++ % 8);
        }
        if (a.isWaiting) state.setAgentWaiting(a.id, true);
        for (const tool of a.activeTools ?? []) {
          state.setAgentTyping(a.id, tool.toolName);
        }
        if (a.inputTokens !== undefined && a.outputTokens !== undefined) {
          state.setAgentTokens(a.id, a.inputTokens, a.outputTokens);
        }
      }
      onRedraw();
      break;
    }

    case 'agentCreated': {
      const agent = msg.agent as AgentInfo;
      if (!state.characters.has(agent.id)) {
        state.addAgent(agent.id, agent.folderName, agentColorCounter++ % 8);
      }
      onRedraw();
      break;
    }

    case 'agentClosed': {
      const agentId = msg.agentId as number;
      state.removeAgent(agentId);
      onRedraw();
      break;
    }

    case 'agentStatus': {
      const agentId = msg.agentId as number;
      const status = msg.status as string;
      if (status === 'waiting') {
        state.setAgentWaiting(agentId, true);
      } else {
        state.setAgentWaiting(agentId, false);
      }
      break;
    }

    case 'agentToolStart': {
      const agentId = msg.agentId as number;
      const toolName = msg.toolName as string;
      state.setAgentTyping(agentId, toolName);
      break;
    }

    case 'agentToolDone': {
      const agentId = msg.agentId as number;
      state.setAgentIdle(agentId);
      break;
    }

    case 'agentToolsClear': {
      const agentId = msg.agentId as number;
      state.setAgentIdle(agentId);
      break;
    }

    case 'agentToolPermission': {
      const agentId = msg.agentId as number;
      state.setAgentPermission(agentId, true);
      break;
    }

    case 'agentToolPermissionClear': {
      const agentId = msg.agentId as number;
      state.setAgentPermission(agentId, false);
      break;
    }

    case 'agentTokenUsage': {
      const agentId = msg.agentId as number;
      const input = msg.inputTokens as number;
      const output = msg.outputTokens as number;
      state.setAgentTokens(agentId, input, output);
      break;
    }

    case 'settingsLoaded': {
      // Settings are handled in App.tsx via a separate state mechanism
      break;
    }
  }
}
