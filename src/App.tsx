import { MetersDisplay } from './components/Meters';
import { ChannelTabs } from './components/ChannelTabs';
import { ChatWindow } from './components/ChatWindow';
import { TimeControls } from './components/TimeControls';
import { ConsequenceFeed } from './components/ConsequenceFeed';
import { useGameState } from './hooks/useGameState';
import './App.css';

function App() {
  const {
    state,
    characters,
    loading,
    setCurrentChannel,
    makeChoice,
    advanceTimeOfDay,
    getMessagesForCurrentChannel,
    sendPlayerMessage,
  } = useGameState();

  const messages = getMessagesForCurrentChannel();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-glitch">K-POP AFTERMATH</div>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">K-POP AFTERMATH</h1>
        <p className="app-subtitle">Choose wisely. Their futures depend on it.</p>
      </header>

      <MetersDisplay
        meters={state.meters}
        trust={state.characterTrust}
        characters={characters}
      />

      <ChannelTabs
        characters={characters}
        currentChannel={state.currentChannel}
        onSelectChannel={setCurrentChannel}
      />

      <ChatWindow
        messages={messages}
        characters={characters}
        currentChannel={state.currentChannel}
        onChoiceSelect={makeChoice}
        onSendMessage={sendPlayerMessage}
      />

      <TimeControls
        day={state.day}
        timeOfDay={state.timeOfDay}
        onAdvance={advanceTimeOfDay}
      />

      <ConsequenceFeed consequences={state.consequences} />
    </div>
  );
}

export default App;
