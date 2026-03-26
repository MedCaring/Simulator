import logging
import os

def setup_logger():
    if not os.path.exists('logs'):
        os.makedirs('logs')
        
    logger = logging.getLogger('YaoGuaiGuai')
    logger.setLevel(logging.DEBUG)
    
    formatter = logging.Formatter('[%(asctime)s] - [%(levelname)s] - %(message)s')
    
    # 文件处理器
    fh = logging.FileHandler('logs/ygg_running.log', encoding='utf-8')
    fh.setLevel(logging.INFO)
    fh.setFormatter(formatter)
    
    # 控制台处理器
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    ch.setFormatter(formatter)
    
    if not logger.handlers:
        logger.addHandler(fh)
        logger.addHandler(ch)
        
    return logger

logger = setup_logger()
